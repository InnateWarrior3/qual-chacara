(() => {
  const C = window.CHACARAS;
  const R = window.ROTAS;
  const $ = (s, el = document) => el.querySelector(s);
  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const normaliza = (s) =>
    (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const porId = (id) => C.find((c) => c.id === id);

  const guarda = {
    ler(k, padrao) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? padrao : JSON.parse(v);
      } catch {
        return padrao;
      }
    },
    gravar(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* navegação privada: segue sem guardar */
      }
    },
  };

  const el = (tag, attrs = {}, ...filhos) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const f of filhos.flat()) if (f != null) n.append(f.nodeType ? f : document.createTextNode(f));
    return n;
  };

  // ---------- Nome ----------
  let nome = guarda.ler("nome", "");
  const ehAdmin = () => normaliza(nome) === normaliza(window.NOME_ADMIN);

  const aplicarNome = () => {
    $("#entrada").hidden = !!nome;
    $("#quem").textContent = nome ? `👤 ${nome}` : "";
    $("#painel").hidden = !ehAdmin();
    if (ehAdmin()) carregarPainel();
  };
  $("#form-nome").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#campo-nome").value.trim();
    if (!v) return;
    nome = v;
    guarda.gravar("nome", nome);
    aplicarNome();
    window.scrollTo(0, 0);
  });
  $("#quem").addEventListener("click", () => {
    $("#campo-nome").value = nome;
    nome = "";
    aplicarNome();
    $("#campo-nome").focus();
  });

  // ---------- Mapa em SVG (sem tiles) ----------
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };

  function mapa({ destaque, fracas, marcos, W = 640, H = 380, titulo }) {
    const lat0 = -22.7 * (Math.PI / 180);
    const kx = Math.cos(lat0);
    const todos = destaque.flatMap((r) => r.pts).concat(marcos.filter((m) => m.enquadra).map((m) => [m.lng, m.lat]));
    let x0 = Math.min(...todos.map((p) => p[0] * kx)), x1 = Math.max(...todos.map((p) => p[0] * kx));
    let y0 = Math.min(...todos.map((p) => -p[1])), y1 = Math.max(...todos.map((p) => -p[1]));
    // margem e proporção do quadro
    const mx = (x1 - x0) * 0.12 + 0.004, my = (y1 - y0) * 0.14 + 0.004;
    x0 -= mx; x1 += mx; y0 -= my; y1 += my;
    const asp = W / H;
    if ((x1 - x0) / (y1 - y0) > asp) {
      const d = (x1 - x0) / asp - (y1 - y0);
      y0 -= d / 2; y1 += d / 2;
    } else {
      const d = (y1 - y0) * asp - (x1 - x0);
      x0 -= d / 2; x1 += d / 2;
    }
    const px = (lng) => ((lng * kx - x0) / (x1 - x0)) * W;
    const py = (lat) => ((-lat - y0) / (y1 - y0)) * H;
    const dentro = (lng, lat) => px(lng) > 30 && px(lng) < W - 30 && py(lat) > 16 && py(lat) < H - 10;
    const caminho = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join("");

    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": titulo });
    for (const cid of window.CIDADES) {
      if (!dentro(cid.lng, cid.lat)) continue;
      const g = svgEl("g", {});
      g.append(svgEl("circle", { cx: px(cid.lng), cy: py(cid.lat), r: 3, fill: "var(--rota-fraca)" }));
      const t = svgEl("text", { x: px(cid.lng) + 6, y: py(cid.lat) + 4, class: "lbl" });
      t.textContent = cid.nome;
      g.append(t);
      svg.append(g);
    }
    for (const r of fracas) {
      svg.append(svgEl("path", { d: caminho(r.pts), fill: "none", stroke: "var(--rota-fraca)", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }
    for (const r of destaque) {
      svg.append(svgEl("path", { d: caminho(r.pts), fill: "none", stroke: "var(--papel)", "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      svg.append(svgEl("path", { d: caminho(r.pts), fill: "none", stroke: r.cor, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }
    for (const m of marcos) {
      const x = px(m.lng), y = py(m.lat);
      const g = svgEl("g", {});
      if (m.tipo === "pedagio") {
        g.append(svgEl("rect", { x: x - 9, y: y - 9, width: 18, height: 18, rx: 4, fill: "#f59e0b", stroke: "var(--papel)", "stroke-width": 2 }));
        const t = svgEl("text", { x, y: y + 4, "text-anchor": "middle", style: "font: 800 11px sans-serif; fill: #111" });
        t.textContent = "$";
        g.append(t);
      } else {
        g.append(svgEl("circle", { cx: x, cy: y, r: m.tipo === "origem" ? 8 : 10, fill: m.cor, stroke: "var(--papel)", "stroke-width": 3 }));
        if (m.rotulo) {
          const esquerda = x > W * 0.7;
          const t = svgEl("text", { x: esquerda ? x - 14 : x + 14, y: y + 4 + (m.dy || 0), class: "lbl-forte", "text-anchor": esquerda ? "end" : "start" });
          t.textContent = m.rotulo;
          g.append(t);
        }
      }
      svg.append(g);
    }
    return svg;
  }

  const origemMarco = { tipo: "origem", lat: window.ORIGEM.lat, lng: window.ORIGEM.lng, cor: "var(--tinta)", rotulo: "Barão (saída)", enquadra: true };

  // Mapa geral com as 5 rotas
  $("#mapa-geral").append(
    mapa({
      titulo: "Mapa com as cinco rotas saindo de Barão Geraldo",
      destaque: C.map((c) => ({ pts: R[c.id].pts, cor: c.cor })),
      fracas: [],
      // 1 e 2 ficam a ~1 km uma da outra: rótulos um acima e outro abaixo
      marcos: [origemMarco, ...C.map((c) => ({ tipo: "destino", lat: c.lat, lng: c.lng, cor: c.cor, rotulo: `${c.emoji} ${c.id.slice(1)}`, enquadra: true, dy: { c1: -10, c2: 10 }[c.id] || 0 }))],
      H: 420,
    }),
  );

  // ---------- Cartões ----------
  const pedagioIdaVolta = (c) => c.pedagios.reduce((s, p) => s + p.valor * p.sentidos, 0);

  const atalhos = $("#atalhos");
  for (const c of C) atalhos.append(el("a", { href: `#${c.id}`, style: `border-color:${c.cor}` }, `${c.emoji} ${c.id.slice(1)}`));
  atalhos.append(el("a", { href: "#ranking" }, "🏆 Votar"));

  const lista = $("#lista");
  C.forEach((c, i) => {
    const r = R[c.id];
    const fotos = Array.from({ length: 8 }, (_, k) => `fotos/${c.id}-${k + 1}.jpg`);
    const carrossel = el(
      "div",
      { class: "carrossel", tabindex: "0", "aria-label": `Fotos de ${c.apelido}` },
      fotos.map((src, k) => el("img", { src, alt: `${c.apelido}, foto ${k + 1} de ${fotos.length}`, loading: k ? "lazy" : "eager" })),
    );
    const contador = el("span", { class: "contador" }, `1/${fotos.length}`);
    carrossel.addEventListener("scroll", () => {
      const k = Math.round(carrossel.scrollLeft / carrossel.clientWidth);
      contador.textContent = `${k + 1}/${fotos.length}`;
    }, { passive: true });
    const passo = (d) => carrossel.scrollBy({ left: d * carrossel.clientWidth, behavior: "smooth" });

    const total = pedagioIdaVolta(c);
    const pedagio = c.pedagios.length
      ? el(
          "div",
          { class: "pedagio" },
          el("strong", {}, `⚠️ Tem pedágio: ~${brl(total)} por carro (ida e volta)`),
          ...c.pedagios.map((p) => el("span", {}, `• ${p.nome}: ${brl(p.valor)}${p.sentidos === 1 ? " (cobra num sentido só)" : " por passagem"}`)),
          el("span", { style: "color:var(--suave)" }, `Dividindo por 4 num carro: ~${brl(total / 4)} cada.`),
        )
      : el("div", { class: "pedagio livre" }, el("strong", {}, "✅ Sem pedágio no caminho"));

    const rotaUrl = `https://www.google.com/maps/dir/?api=1&origin=${window.ORIGEM.lat},${window.ORIGEM.lng}&destination=${c.lat},${c.lng}&travelmode=driving`;

    lista.append(
      el(
        "article",
        { class: "chacara", id: c.id, style: `--cor:${c.cor}` },
        el(
          "div",
          { class: "cabeca" },
          el("span", { class: "numero" }, `Opção ${i + 1} · 📍 ${c.cidade}`),
          el("h2", {}, `${c.emoji} ${c.apelido}`),
          el("p", { class: "real" }, c.nome),
        ),
        el("div", { class: "fotos" }, carrossel, contador,
          el("button", { class: "seta esq", type: "button", "aria-label": "Foto anterior", onclick: () => passo(-1) }, "‹"),
          el("button", { class: "seta dir", type: "button", "aria-label": "Próxima foto", onclick: () => passo(1) }, "›"),
        ),
        el("div", { class: "fatos" }, el("span", {}, c.capacidade), el("span", {}, c.nota)),
        el(
          "div",
          { class: "precos" },
          el("div", { class: "preco" }, el("div", { class: "rot" }, "Sex → Dom · 2 noites"), el("div", { class: "val" }, brl(c.total2n / window.PESSOAS)), el("div", { class: "tot" }, `por pessoa · total ${brl(c.total2n)}`)),
          el("div", { class: "preco" }, el("div", { class: "rot" }, "Qui → Dom · 3 noites"), el("div", { class: "val" }, brl(c.total3n / window.PESSOAS)), el("div", { class: "tot" }, `por pessoa · total ${brl(c.total3n)}`)),
        ),
        el("div", { class: "chips" }, c.lazer.map((l) => el("span", { class: "chip" }, l))),
        el(
          "div",
          { class: "proscontras" },
          el("div", { class: "pc bom" }, el("h3", {}, "👍 Prós"), el("ul", {}, c.pros.map((p) => el("li", {}, p)))),
          el("div", { class: "pc ruim" }, el("h3", {}, "👎 Contras"), el("ul", {}, c.contras.map((p) => el("li", {}, p)))),
        ),
        el(
          "div",
          { class: "rota" },
          mapa({
            titulo: `Rota de Barão Geraldo até ${c.apelido}`,
            destaque: [{ pts: r.pts, cor: c.cor }],
            fracas: [],
            marcos: [
              origemMarco,
              ...c.pedagios.map((p) => ({ tipo: "pedagio", lat: p.lat, lng: p.lng })),
              { tipo: "destino", lat: c.lat, lng: c.lng, cor: c.cor, rotulo: `${c.emoji} ${c.cidade}`, enquadra: true },
            ],
            H: 340,
          }),
          el(
            "div",
            { class: "rota-info" },
            el("div", {}, el("b", {}, `~${Math.round(r.km)} km`), el("span", {}, "de carro, só ida")),
            el("div", {}, el("b", {}, `~${r.min} min`), el("span", {}, "sem trânsito")),
          ),
          pedagio,
          el(
            "div",
            { class: "links" },
            el("a", { href: rotaUrl, target: "_blank", rel: "noopener" }, "🗺️ Abrir rota no Google Maps"),
            el("a", { href: `https://www.airbnb.com.br/rooms/${c.airbnb}`, target: "_blank", rel: "noopener" }, "🏠 Ver anúncio no Airbnb"),
          ),
        ),
      ),
    );
  });

  // ---------- Ranking ----------
  let ordem = guarda.ler("ranking", null);
  if (!Array.isArray(ordem) || ordem.length !== C.length || !ordem.every(porId)) ordem = C.map((c) => c.id);

  const desenharRank = () => {
    const ol = $("#rank");
    ol.replaceChildren(
      ...ordem.map((id, i) => {
        const c = porId(id);
        const mover = (d) => {
          const j = i + d;
          [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
          guarda.gravar("ranking", ordem);
          desenharRank();
          ol.children[j].querySelector(d < 0 ? ".sobe" : ".desce")?.focus();
        };
        return el(
          "li",
          { style: `--cor:${c.cor}` },
          el("span", { class: "pos" }, `${i + 1}º`),
          el("span", { class: "nome" }, `${c.emoji} ${c.apelido}`, el("small", {}, `${c.cidade} · ${brl(c.total2n / window.PESSOAS)}/pessoa (2 noites)`)),
          el(
            "span",
            { class: "mover" },
            el("button", { type: "button", class: "sobe", "aria-label": `Subir ${c.apelido}`, onclick: () => mover(-1), ...(i === 0 ? { disabled: "" } : {}) }, "▲"),
            el("button", { type: "button", class: "desce", "aria-label": `Descer ${c.apelido}`, onclick: () => mover(1), ...(i === C.length - 1 ? { disabled: "" } : {}) }, "▼"),
          ),
        );
      }),
    );
  };
  desenharRank();
  $("#campo-obs").value = guarda.ler("obs", "");

  // ---------- Votos (planilha Google ou modo de teste) ----------
  const URL_VOTOS = (window.VOTOS_URL || "").trim();

  async function enviarVoto(voto) {
    if (!URL_VOTOS) {
      const lista = guarda.ler("votos-teste", []);
      lista.push(voto);
      guarda.gravar("votos-teste", lista);
      return;
    }
    // text/plain evita a checagem CORS (preflight) que o Apps Script não responde
    const r = await fetch(URL_VOTOS, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(voto) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.erro || "falhou");
  }

  async function lerVotos() {
    if (!URL_VOTOS) return guarda.ler("votos-teste", []);
    const r = await fetch(`${URL_VOTOS}?t=${Date.now()}`);
    const j = await r.json();
    return j.votos || [];
  }

  $("#enviar").addEventListener("click", async () => {
    const st = $("#status");
    if (!nome) {
      aplicarNome();
      return;
    }
    const botao = $("#enviar");
    botao.disabled = true;
    st.className = "status";
    st.textContent = "Enviando…";
    const obs = $("#campo-obs").value.trim();
    guarda.gravar("obs", obs);
    try {
      await enviarVoto({ nome, ranking: ordem, obs, quando: new Date().toISOString() });
      st.className = "status ok";
      st.textContent = URL_VOTOS
        ? `Valeu, ${nome}! Ranking enviado: 1º ${porId(ordem[0]).apelido}.`
        : "Modo de teste: ranking guardado só neste aparelho (planilha ainda não configurada).";
      if (ehAdmin()) carregarPainel();
    } catch {
      st.className = "status erro";
      st.textContent = "Não consegui enviar. Confere a internet e tenta de novo.";
    } finally {
      botao.disabled = false;
    }
  });

  // ---------- Painel do admin ----------
  async function carregarPainel() {
    const st = $("#painel-status");
    const box = $("#painel-conteudo");
    st.className = "status";
    st.textContent = "Carregando votos…";
    let votos;
    try {
      votos = await lerVotos();
    } catch {
      st.className = "status erro";
      st.textContent = "Não consegui ler a planilha. Confere a URL em config.js.";
      return;
    }
    // vale o último envio de cada pessoa
    const ultimo = new Map();
    for (const v of votos) {
      if (!Array.isArray(v.ranking)) continue;
      const k = normaliza(v.nome);
      const ant = ultimo.get(k);
      if (!ant || String(v.quando) >= String(ant.quando)) ultimo.set(k, v);
    }
    const validos = [...ultimo.values()];
    if (!validos.length) {
      st.textContent = URL_VOTOS ? "Ninguém votou ainda. Manda o link no grupo!" : "Modo de teste e sem votos ainda.";
      box.replaceChildren();
      return;
    }
    const n = validos.length;
    const stats = C.map((c) => {
      const pos = validos.map((v) => v.ranking.indexOf(c.id) + 1).filter((p) => p > 0);
      return {
        c,
        pontos: pos.reduce((s, p) => s + (C.length + 1 - p), 0), // 1º = 5 pts … 5º = 1 pt
        media: pos.reduce((s, p) => s + p, 0) / (pos.length || 1),
        primeiros: pos.filter((p) => p === 1).length,
        ultimos: pos.filter((p) => p === C.length).length,
      };
    }).sort((a, b) => b.pontos - a.pontos || a.media - b.media);
    const maxPts = n * C.length;

    st.className = "status ok";
    st.textContent = `${n} ${n === 1 ? "pessoa votou" : "pessoas votaram"}${URL_VOTOS ? "" : " (modo de teste)"}.`;
    box.replaceChildren(
      el("h3", {}, "Placar geral (1º = 5 pts … 5º = 1 pt)"),
      el(
        "div",
        { class: "placar" },
        stats.map((s, i) =>
          el(
            "div",
            { class: "placar-item", style: `--cor:${s.c.cor}` },
            el("span", {}, el("b", {}, `${i + 1}º ${s.c.emoji} ${s.c.apelido}`)),
            el("span", {}, `${s.pontos} pts`),
            el("div", { class: "barra-fundo" }, el("div", { class: "barra", style: `width:${(s.pontos / maxPts) * 100}%` })),
            el("span", { class: "resumo", style: "grid-column:1/-1" }, el("span", {}, "posição média ", el("b", {}, s.media.toFixed(1).replace(".", ","))), el("span", {}, "1º lugar ", el("b", {}, `${s.primeiros}×`)), el("span", {}, "último ", el("b", {}, `${s.ultimos}×`))),
          ),
        ),
      ),
      el("h3", { style: "margin-top:18px" }, "Voto de cada um"),
      el(
        "div",
        { class: "tabela-wrap" },
        el(
          "table",
          {},
          el("thead", {}, el("tr", {}, el("th", {}, "Quem"), ...C.map((_, i) => el("th", {}, `${i + 1}º`)), el("th", {}, "Comentário"))),
          el(
            "tbody",
            {},
            validos
              .sort((a, b) => String(a.nome).localeCompare(String(b.nome)))
              .map((v) => el("tr", {}, el("td", {}, el("b", {}, v.nome)), ...v.ranking.map((id) => el("td", {}, `${porId(id)?.emoji || ""} ${porId(id)?.apelido || id}`)), el("td", {}, v.obs || ""))),
          ),
        ),
      ),
    );
  }
  $("#atualizar").addEventListener("click", carregarPainel);

  aplicarNome();
})();
