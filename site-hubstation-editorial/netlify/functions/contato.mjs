export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  const { nome, email, empresa, telefone, segmento, servico, mensagem } = body;

  if (!nome || !email || !mensagem) {
    return new Response(JSON.stringify({ error: "Campos obrigatórios ausentes" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Configuração de e-mail ausente" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const primeiroNome = nome.split(" ")[0];

  const htmlInterno = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#060606;padding:32px 40px">
      <h1 style="color:#fff;font-size:20px;margin:0 0 4px">HubStation</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:0;letter-spacing:0.12em;text-transform:uppercase">Novo formulário de contato</p>
    </div>
    <div style="height:3px;background:#F44336"></div>
    <div style="background:#FAFAF8;padding:36px 40px;border:1px solid #e8e6e1;border-top:none">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:11px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em;width:130px">Nome</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:15px">${nome}</td></tr>
        <tr><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:11px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em">E-mail</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:15px"><a href="mailto:${email}" style="color:#F44336">${email}</a></td></tr>
        ${empresa ? `<tr><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:11px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em">Empresa</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:15px">${empresa}</td></tr>` : ""}
        ${telefone ? `<tr><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:11px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em">Telefone</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:15px">${telefone}</td></tr>` : ""}
        ${segmento ? `<tr><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:11px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em">Segmento</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:15px">${segmento}</td></tr>` : ""}
        ${servico ? `<tr><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:11px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em">Interesse</td><td style="padding:11px 0;border-bottom:1px solid #eee;font-size:15px">${servico}</td></tr>` : ""}
      </table>
      <div style="margin-top:24px;padding:20px 24px;background:#fff;border:1px solid #e8e6e1;border-left:3px solid #F44336">
        <p style="font-size:10px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Mensagem</p>
        <p style="font-size:14px;line-height:1.75;margin:0">${mensagem.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
    <div style="background:#F5F3EE;padding:16px 40px;text-align:center">
      <p style="font-size:10px;color:#bbb;margin:0">HubStation · <a href="https://hubstation.com.br" style="color:#F44336">hubstation.com.br</a></p>
    </div>
  </div>`;

  const htmlAgradecimento = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
    <div style="background:#060606;padding:40px 40px 32px">
      <div style="margin-bottom:20px"><span style="font-size:20px;font-weight:700;color:#fff">HUBSTATION</span></div>
      <h1 style="color:#fff;font-size:26px;font-weight:600;margin:0 0 12px;line-height:1.2">Obrigado pelo contato, ${primeiroNome}!</h1>
      <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0;line-height:1.65">Recebemos o seu cadastro. Nossa equipe entrará em contato o mais breve possível.</p>
    </div>
    <div style="height:3px;background:#F44336"></div>
    <div style="background:#FAFAF8;padding:36px 40px;border:1px solid #e8e6e1;border-top:none">
      <p style="font-size:15px;color:#4A4A4A;line-height:1.75;margin:0 0 28px">Agradecemos o seu interesse na <strong>HubStation</strong>. Analisaremos o contexto da sua marca e retornaremos em breve com as melhores alternativas para a sua comunicação no mercado condominial.</p>
      ${empresa || segmento || servico ? `<div style="background:#fff;border:1px solid #e8e6e1;border-left:3px solid #F44336;padding:20px 24px;margin-bottom:28px">
        <p style="font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9A9A9A;margin:0 0 12px">Seu cadastro em resumo</p>
        ${empresa ? `<p style="margin:0 0 6px;font-size:13px;color:#4A4A4A"><strong>Empresa:</strong> ${empresa}</p>` : ""}
        ${segmento ? `<p style="margin:0 0 6px;font-size:13px;color:#4A4A4A"><strong>Segmento:</strong> ${segmento}</p>` : ""}
        ${servico ? `<p style="margin:0;font-size:13px;color:#4A4A4A"><strong>Interesse:</strong> ${servico}</p>` : ""}
      </div>` : ""}
      <div style="background:#060606;padding:24px 28px;margin-bottom:28px">
        <p style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:0 0 14px">O que acontece agora</p>
        <div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <div style="width:20px;height:20px;border-radius:50%;background:#F44336;color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:20px;flex-shrink:0">1</div>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.55">Lemos seu cadastro e analisamos o contexto da sua marca</p>
        </div>
        <div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <div style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;text-align:center;line-height:18px;flex-shrink:0">2</div>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.55">Nossa equipe entra em contato o mais breve possível</p>
        </div>
        <div style="display:flex;gap:14px;padding:10px 0">
          <div style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;text-align:center;line-height:18px;flex-shrink:0">3</div>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.55">Apresentamos um caminho real para a comunicação da sua marca</p>
        </div>
      </div>
      <div style="text-align:center">
        <a href="https://hubstation.com.br/servicos.html" style="display:inline-block;background:#F44336;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding:14px 30px">Conheça nossos serviços →</a>
      </div>
    </div>
    <div style="background:#F5F3EE;padding:18px 40px;text-align:center">
      <p style="font-size:11px;color:#9A9A9A;margin:0 0 3px"><a href="https://hubstation.com.br" style="color:#F44336">hubstation.com.br</a> · <a href="https://instagram.com/hubstationbr" style="color:#9A9A9A">@hubstationbr</a></p>
      <p style="font-size:10px;color:#ccc;margin:0">Você recebeu este e-mail porque preencheu o formulário de contato da HubStation.</p>
    </div>
  </div>`;

  try {
    const [notifResp, confirmResp] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "HubStation <contato@hubstation.com.br>",
          to: ["contato@hubstation.com.br"],
          reply_to: email,
          subject: `Novo contato: ${nome}${empresa ? ` · ${empresa}` : ""}`,
          html: htmlInterno,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "HubStation <contato@hubstation.com.br>",
          to: [email],
          subject: `Obrigado pelo contato, ${primeiroNome}! Nossa equipe retornará em breve.`,
          html: htmlAgradecimento,
        }),
      }),
    ]);

    if (!notifResp.ok) {
      const err = await notifResp.text();
      console.error("Resend erro interno:", err);
      return new Response(JSON.stringify({ error: "Falha no envio" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    if (!confirmResp.ok) console.warn("Agradecimento não enviado:", await confirmResp.text());

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro de rede:", err);
    return new Response(JSON.stringify({ error: "Erro de rede" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/contato" };
