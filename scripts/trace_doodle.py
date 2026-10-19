"""Trace a one-line doodle image into a single continuous SVG path (M + C only).

usage: python scripts/trace_doodle.py design/doodles/3-feed.png out/feed [--entry left|top|bottom|right] [--exit bottom|right|left] [--eps 1.5] [--work 2048] [--smooth 2] [--gap 60]
writes out_prefix.json ({w, h, d, start, end, stats}) and out_prefix.png (preview)
"""
import heapq
import json
import math
import sys
from collections import defaultdict

import numpy as np
from PIL import Image, ImageDraw

WORK_W = 1024  # trace at this width (--work); coordinates always come out at this width


def load(path, work=WORK_W):
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, "white")
    bg.alpha_composite(im)
    g = bg.convert("L")
    if g.width != work:
        g = g.resize((work, round(g.height * work / g.width)), Image.LANCZOS)
    return np.asarray(g, dtype=np.uint8)


def components(mask):
    """label 8-connected components; returns list of pixel index arrays"""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    comps = []
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys, xs):
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        pix = []
        while stack:
            y, x = stack.pop()
            pix.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        comps.append(pix)
    return comps


def bridge(mask, max_gap=60):
    """join every piece of the drawing to the rest with a short pen stroke across its nearest gap"""
    mask = mask.copy()
    while True:
        comps = sorted(components(mask), key=len, reverse=True)
        if len(comps) < 2:
            return mask
        main = np.array(comps[0])
        best = None
        for c in comps[1:]:
            ca = np.array(c)
            for i in range(0, len(ca), 400):
                chunk = ca[i : i + 400]
                d2 = ((chunk[:, None, :] - main[None, :, :]) ** 2).sum(-1)
                j = np.unravel_index(np.argmin(d2), d2.shape)
                dist = math.sqrt(d2[j])
                if best is None or dist < best[0]:
                    best = (dist, tuple(chunk[j[0]]), tuple(main[j[1]]))
        if best is None or best[0] > max_gap:
            return mask
        _, (ya, xa), (yb, xb) = best
        im = Image.fromarray(mask.astype(np.uint8) * 255)
        ImageDraw.Draw(im).line([(xa, ya), (xb, yb)], fill=255, width=3)
        mask = np.asarray(im) > 0


def zhang_suen(img):
    img = img.copy().astype(np.uint8)
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            p = np.pad(img, 1)
            P2 = p[:-2, 1:-1]; P3 = p[:-2, 2:]; P4 = p[1:-1, 2:]; P5 = p[2:, 2:]
            P6 = p[2:, 1:-1]; P7 = p[2:, :-2]; P8 = p[1:-1, :-2]; P9 = p[:-2, :-2]
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(n.astype(int) for n in nb)
            seq = nb + [P2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0:
                c = (P2 * P4 * P6 == 0) & (P4 * P6 * P8 == 0)
            else:
                c = (P2 * P4 * P8 == 0) & (P2 * P6 * P8 == 0)
            rm = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if rm.any():
                img[rm] = 0
                changed = True
    return img


N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def build_graph(skel):
    """nodes: junction clusters and endpoints; edges: pixel polylines between them"""
    h, w = skel.shape
    on = set(zip(*np.nonzero(skel)))

    def nbrs(p):
        y, x = p
        return [(y + dy, x + dx) for dy, dx in N8 if (y + dy, x + dx) in on]

    deg = {p: len(nbrs(p)) for p in on}
    junc = {p for p in on if deg[p] > 2}
    # cluster adjacent junction pixels into one node
    node_of = {}
    nodes = []
    for p in junc:
        if p in node_of:
            continue
        idx = len(nodes)
        stack = [p]
        node_of[p] = idx
        cl = []
        while stack:
            q = stack.pop()
            cl.append(q)
            for r in nbrs(q):
                if r in junc and r not in node_of:
                    node_of[r] = idx
                    stack.append(r)
        cy = sum(c[0] for c in cl) / len(cl)
        cx = sum(c[1] for c in cl) / len(cl)
        nodes.append({"p": (cx, cy), "pix": cl})
    for p in on:
        if deg[p] <= 1 and p not in node_of:
            node_of[p] = len(nodes)
            nodes.append({"p": (p[1], p[0]), "pix": [p]})

    edges = []
    used = set()  # (a, b) pixel steps already walked

    def walk(start_node, first):
        path = [first]
        prev = None
        cur = first
        # the start pixel of the node nearest `first`
        while True:
            if cur in node_of and len(path) > 1:
                return node_of[cur], path
            if cur in node_of and node_of[cur] != start_node:
                return node_of[cur], path
            nxt = [r for r in nbrs(cur) if r != prev and r not in path[-3:]]
            # never step back into the start cluster once out of it
            nxt = [r for r in nxt if not (r in node_of and node_of[r] == start_node and len(path) < 3)]
            if not nxt:
                return None, path
            # prefer 4-neighbours (avoid diagonal shortcuts past a pixel)
            nxt.sort(key=lambda r: (r in node_of) * -1 + (abs(r[0] - cur[0]) + abs(r[1] - cur[1])))
            node_hit = [r for r in nxt if r in node_of]
            r = node_hit[0] if node_hit else nxt[0]
            if (cur, r) in used:
                return None, path
            used.add((cur, r)); used.add((r, cur))
            prev = cur
            cur = r
            path.append(cur)

    for ni, nd in enumerate(nodes):
        for px in nd["pix"]:
            for r in nbrs(px):
                if r in node_of and node_of[r] == ni:
                    continue
                if (px, r) in used:
                    continue
                used.add((px, r)); used.add((r, px))
                end, path = walk(ni, r)
                if end is None:
                    continue
                pts = [(px[1], px[0])] + [(q[1], q[0]) for q in path]
                edges.append([ni, end, pts])
    # isolated loops (no node at all)
    covered = set()
    for _, _, pts in edges:
        covered.update((int(y), int(x)) for x, y in pts)
    for nd in nodes:
        covered.update(nd["pix"])
    rest = on - covered
    while rest:
        p = next(iter(rest))
        idx = len(nodes)
        nodes.append({"p": (p[1], p[0]), "pix": [p]})
        node_of[p] = idx
        loop = [p]
        prev, cur = None, p
        while True:
            nx = [r for r in nbrs(cur) if r != prev and r in rest and r not in loop]
            if not nx:
                break
            prev, cur = cur, nx[0]
            loop.append(cur)
        pts = [(q[1], q[0]) for q in loop] + [(p[1], p[0])]
        edges.append([idx, idx, pts])
        rest -= set(loop)
    return nodes, edges


def plen(pts):
    return sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def prune(nodes, edges, spur):
    """drop short dead-end spurs, repeatedly"""
    for _ in range(3):
        deg = defaultdict(int)
        for a, b, _ in edges:
            deg[a] += 1
            deg[b] += 1
        keep = []
        for e in edges:
            a, b, pts = e
            if a != b and (deg[a] == 1 or deg[b] == 1) and deg[a] + deg[b] > 2 and plen(pts) < spur:
                continue
            keep.append(e)
        edges = keep
    return edges


def graph_components(n, edges):
    adj = defaultdict(list)
    for i, (a, b, _) in enumerate(edges):
        adj[a].append(i)
        adj[b].append(i)
    seen = set()
    comps = []
    for i in range(len(edges)):
        if i in seen:
            continue
        stack = [i]
        seen.add(i)
        comp = []
        while stack:
            k = stack.pop()
            comp.append(k)
            for nd in edges[k][:2]:
                for j in adj[nd]:
                    if j not in seen:
                        seen.add(j)
                        stack.append(j)
        comps.append(comp)
    return comps


def dijkstra(adj, src):
    dist = {src: 0}
    prev = {}
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18):
            continue
        for v, w, ei in adj[u]:
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd
                prev[v] = (u, ei)
                heapq.heappush(pq, (nd, v))
    return dist, prev


def euler_route(nodes, edges, start, end):
    """an edge sequence from start to end covering every edge, retracing the fewest"""
    adj = defaultdict(list)
    for i, (a, b, pts) in enumerate(edges):
        w = plen(pts)
        adj[a].append((b, w, i))
        adj[b].append((a, w, i))
    deg = defaultdict(int)
    for a, b, _ in edges:
        deg[a] += 1
        deg[b] += 1
    odd = {v for v in deg if deg[v] % 2}
    # the route's own ends should be the odd ones out
    for v in (start, end):
        if start == end:
            break
        odd ^= {v}
    odd = list(odd)
    # greedy matching of odd nodes by shortest path, duplicating those paths
    dup = []
    dists = {v: dijkstra(adj, v) for v in odd}
    pairs = []
    for i, u in enumerate(odd):
        for v in odd[i + 1:]:
            if v in dists[u][0]:
                pairs.append((dists[u][0][v], u, v))
    pairs.sort()
    matched = set()
    for d, u, v in pairs:
        if u in matched or v in matched:
            continue
        matched.update((u, v))
        prev = dists[u][1]
        x = v
        while x != u:
            px, ei = prev[x]
            dup.append(ei)
            x = px
    multi = list(range(len(edges))) + dup
    # Hierholzer over the multigraph
    inc = defaultdict(list)
    for k, ei in enumerate(multi):
        a, b, _ = edges[ei]
        inc[a].append(k)
        inc[b].append(k)
    usedk = [False] * len(multi)

    def other(k, v):
        a, b, _ = edges[multi[k]]
        return b if v == a else a

    def leave(k, v, n=8):
        """unit heading as the pen leaves v along multi-edge k"""
        a, b, pts = edges[multi[k]]
        p = pts if (a == v) else pts[::-1]
        q = p[min(n, len(p) - 1)]
        dx, dy = q[0] - p[0][0], q[1] - p[0][1]
        l = math.hypot(dx, dy) or 1
        return dx / l, dy / l

    def arrive(k, v, n=8):
        """unit heading as the pen arrives at v along multi-edge k"""
        hx, hy = leave(k, v, n)
        return -hx, -hy

    # like a pen: at every crossing carry straight on along the least-turning stroke
    stack = [(start, None, None)]
    out = []
    while stack:
        v, k_in, heading = stack[-1]
        free = [k for k in inc[v] if not usedk[k]]
        if free:
            if heading is None:
                k = free[0]
            else:
                k = max(free, key=lambda k: heading[0] * leave(k, v)[0] + heading[1] * leave(k, v)[1])
            usedk[k] = True
            w = other(k, v)
            stack.append((w, k, arrive(k, w)))
        else:
            stack.pop()
            if k_in is not None:
                out.append((k_in, v))
    out.reverse()
    # out: list of (multi-edge k, node arrived at); orient each edge
    seq = []
    cur = start
    for k, arrive in out:
        a, b, pts = edges[multi[k]]
        p = list(pts if (a == b or a == cur) else pts[::-1])
        # join edges exactly at the node's centre
        p[0] = nodes[cur]["p"]
        p[-1] = nodes[arrive]["p"]
        seq.append(p)
        cur = arrive
    return seq, len(dup), sum(usedk) == len(multi)


def smooth(pts, k=4):
    if len(pts) < 5:
        return pts
    a = np.array(pts, dtype=float)
    out = a.copy()
    for i in range(1, len(a) - 1):
        lo, hi = max(0, i - k), min(len(a), i + k + 1)
        out[i] = a[lo:hi].mean(axis=0)
    return [tuple(p) for p in out]


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a = np.array(pts)
    s, e = a[0], a[-1]
    d = e - s
    n = np.hypot(*d)
    if n == 0:
        dist = np.hypot(*(a - s).T)
    else:
        dist = np.abs(d[0] * (a[:, 1] - s[1]) - d[1] * (a[:, 0] - s[0])) / n
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def to_cubics(pts):
    """Catmull-Rom through the points -> cubic segments [(c1, c2, p)]"""
    segs = []
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < n else pts[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        segs.append((c1, c2, p2))
    return segs


def pick_end(nodes, edges, side, w, h, avoid=None):
    deg = defaultdict(int)
    for a, b, _ in edges:
        deg[a] += 1
        deg[b] += 1
    ends = [v for v in deg if deg[v] == 1 and v != avoid]
    if not ends:
        ends = [v for v in deg if v != avoid]

    def score(v):
        x, y = nodes[v]["p"]
        return {"left": x, "right": w - x, "top": y, "bottom": h - y}[side]

    return min(ends, key=score)


def main():
    src, out = sys.argv[1], sys.argv[2]
    opts = dict(zip(sys.argv[3::2], sys.argv[4::2]))
    entry = opts.get("--entry", "left")
    exit_ = opts.get("--exit", "bottom")
    eps = float(opts.get("--eps", "0.9"))
    work = int(opts.get("--work", WORK_W))
    k = int(opts.get("--smooth", "4"))
    # fine detail (hand lettering) traces at a higher resolution, then scales back
    s = WORK_W / work
    g = load(src, work)
    h, w = g.shape
    mask = g < 150
    # drop specks (and the faint corner mark)
    comps = components(mask)
    big = max(len(c) for c in comps)
    keepmask = np.zeros_like(mask)
    small = []
    for c in comps:
        if len(c) >= max(60, big * 0.004):
            for y, x in c:
                keepmask[y, x] = True
        else:
            small.append(len(c))
    keepmask = bridge(keepmask, int(opts.get("--gap", "60")))
    skel = zhang_suen(keepmask.astype(np.uint8))
    nodes, edges = build_graph(skel)
    edges = [e for e in edges if len(e[2]) >= 2]
    edges = prune(nodes, edges, spur=10)
    comps_e = graph_components(len(nodes), edges)
    comps_e.sort(key=lambda c: -sum(plen(edges[i][2]) for i in c))
    lens = [round(sum(plen(edges[i][2]) for i in c)) for c in comps_e]
    main_c = set(comps_e[0])
    dropped = lens[1:]
    edges = [edges[i] for i in sorted(main_c)]
    start = pick_end(nodes, edges, entry, w, h)
    end = pick_end(nodes, edges, exit_, w, h, avoid=start)
    seq, ndup, ok = euler_route(nodes, edges, start, end)
    # concatenate edges; fit each edge on its own so corners at junctions stay crisp
    d_segs = []
    first = None
    for pts in seq:
        sp = rdp(smooth(pts, k), eps)
        if first is None:
            first = sp[0]
        d_segs.extend(to_cubics(sp))
    # crop to the drawing, with a margin
    allp = [first] + [s[2] for s in d_segs] + [c for s in d_segs for c in s[:2]]
    xs = [p[0] for p in allp]
    ys = [p[1] for p in allp]
    m = 6
    x0, y0 = max(0, min(xs) - m), max(0, min(ys) - m)
    x1, y1 = min(w, max(xs) + m), min(h, max(ys) + m)
    # ends that touch the image edge stay on the scene's edge
    f = lambda p: (round((p[0] - x0) * s, 1), round((p[1] - y0) * s, 1))
    W, H = round((x1 - x0) * s), round((y1 - y0) * s)
    fx, fy = f(first)
    parts = [f"M{fx},{fy}"]
    for c1, c2, p in d_segs:
        a, b, c = f(c1), f(c2), f(p)
        parts.append(f"C{a[0]},{a[1]} {b[0]},{b[1]} {c[0]},{c[1]}")
    d = " ".join(parts)
    endp = f(d_segs[-1][2])
    stats = {
        "segments": len(d_segs),
        "edges": len(edges),
        "retraced_edges": ndup,
        "euler_ok": ok,
        "dropped_components_px": dropped,
        "dropped_specks": len(small),
        "chars": len(d),
    }
    json.dump({"w": W, "h": H, "d": d, "start": [fx, fy], "end": list(endp), "stats": stats}, open(out + ".json", "w"))
    # preview: the path in order, light to dark, with start (green) and end (red)
    S = 2
    im = Image.new("RGB", (W * S, H * S), "white")
    dr = ImageDraw.Draw(im)
    pts = [(fx, fy)]
    prev = (fx, fy)
    for c1, c2, p in d_segs:
        a, b, c = f(c1), f(c2), f(p)
        for t in np.linspace(0, 1, 6)[1:]:
            u = 1 - t
            q = (
                u**3 * prev[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t**3 * c[0],
                u**3 * prev[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t**3 * c[1],
            )
            pts.append(q)
        prev = c
    n = len(pts)
    for i in range(n - 1):
        k = int(200 * (1 - i / n))
        dr.line([(pts[i][0] * S, pts[i][1] * S), (pts[i + 1][0] * S, pts[i + 1][1] * S)], fill=(k, k, k), width=3)
    for p, col in ((pts[0], (0, 170, 0)), (pts[-1], (220, 0, 0))):
        dr.ellipse([p[0] * S - 9, p[1] * S - 9, p[0] * S + 9, p[1] * S + 9], fill=col)
    im.save(out + ".png")
    print(json.dumps({"w": W, "h": H, "start": [fx, fy], "end": endp, **stats}))


if __name__ == "__main__":
    main()
