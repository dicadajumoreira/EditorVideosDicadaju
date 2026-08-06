#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Calendario editorial do blog da HubStation — 4 materias por mes, de janeiro de
2025 a julho de 2026 (19 meses, 76 vagas).

As 9 materias que ja existiam no site ocupam as suas vagas; as demais estao
listadas aqui. Cada linha e: (data, tema, titulo, angulo).

Os 6 temas sao fixos, porque sao o filtro da pagina /blog:
    Branding · Posicionamento · Identidade · Digital · Estrategia · Crescimento

Rodar para ver o calendario e o que falta escrever:
    python3 conteudo/blog/plano-editorial.py
"""

# Publicadas (ja no ar) — nao mexer, so referencia de vaga ocupada
PUBLICADAS = [
    ("2026-04-22", "Branding", "Por que o mercado condominial precisa de branding estrategico agora"),
    ("2026-04-08", "Posicionamento", "Como sindicos profissionais podem construir autoridade de marca"),
    ("2026-03-25", "Digital", "Social media para administradoras: o que realmente funciona"),
    ("2026-03-11", "Estrategia", "Os 5 erros de comunicacao mais comuns no mercado condominial"),
    ("2026-03-04", "Identidade", "Identidade visual para empresas condominiais: o guia completo"),
    ("2026-02-19", "Crescimento", "Trafego pago para o mercado condominial: como atrair os clientes certos"),
    ("2026-02-11", "Branding", "Tom de voz de marca e por que o setor condominial precisa do seu"),
    ("2026-02-04", "Posicionamento", "Proposta de valor no mercado condominial: como definir e comunicar a sua"),
    ("2026-01-21", "Digital", "Site para empresa condominial: sua principal ferramenta de autoridade"),
]

# A escrever — 67 materias, 4 por mes contando as ja publicadas
PLANO = [
    # ---------------------------------------------------------------- 2025
    ("2025-01-07", "Branding", "O que uma marca resolve num setor que vende serviço invisível",
     "Por que serviço que só aparece quando falha precisa de marca mais do que produto que se vê."),
    ("2025-01-14", "Posicionamento", "Para quem você não trabalha: o recorte que ninguém quer fazer",
     "Escolher o público que fica de fora é a decisão que mais dói e mais separa."),
    ("2025-01-21", "Digital", "Google Meu Negócio para empresas condominiais: o ativo esquecido",
     "A ficha gratuita que decide quem aparece na busca local, e que quase ninguém preenche direito."),
    ("2025-01-28", "Estrategia", "Comunicação de crise em condomínio: o roteiro que se escreve antes",
     "Vazamento, acidente, furto, obra parada. O que preparar enquanto está tudo calmo."),

    ("2025-02-04", "Identidade", "A paleta de cores do mercado condominial é azul. E daí?",
     "Quando pertencer ao código do setor ajuda, e quando só apaga a marca."),
    ("2025-02-11", "Crescimento", "Indicação não é sorte: como transformar cliente satisfeito em canal",
     "O processo que faz a indicação sair do acaso e virar previsão."),
    ("2025-02-18", "Posicionamento", "Administradora regional contra administradora nacional: quem ganha o quê",
     "As duas posições são defensáveis. O problema é ficar no meio."),
    ("2025-02-25", "Digital", "WhatsApp Business no comercial condominial: o que configurar antes de usar",
     "Catálogo, respostas rápidas, etiquetas e o que nunca fazer num canal que é pessoal."),

    ("2025-03-04", "Estrategia", "Pilares de conteúdo: como parar de decidir o post na véspera",
     "Três ou quatro eixos fixos resolvem doze meses de calendário."),
    ("2025-03-11", "Branding", "Marca pessoal do fundador ou marca da empresa: onde investir",
     "O dilema de quem construiu a reputação no próprio nome e agora quer escalar."),
    ("2025-03-18", "Identidade", "Uniforme, frota e placa de obra: a identidade que anda pela cidade",
     "Os pontos de contato físicos que a maior parte dos manuais esquece."),
    ("2025-03-25", "Crescimento", "Proposta comercial que fecha: estrutura para o mercado condominial",
     "O que colocar, em que ordem, e o que tirar de uma proposta que vai ser lida por um conselho."),

    ("2025-04-01", "Digital", "SEO local para o setor condominial: ser achado por bairro",
     "Por que a busca por região vale mais que a busca genérica neste mercado."),
    ("2025-04-08", "Posicionamento", "Prestador de serviço condominial: como sair da guerra de orçamento",
     "Manutenção, limpeza, portaria. O caminho para deixar de ser escolhido só por preço."),
    ("2025-04-15", "Estrategia", "A assembleia como peça de comunicação",
     "Convocação, condução e ata como oportunidades de marca que ninguém usa."),
    ("2025-04-22", "Branding", "Arquitetura de marca: quando criar uma submarca e quando não",
     "Grupos com várias frentes de serviço e o risco de fragmentar a reputação."),

    ("2025-05-06", "Identidade", "Tipografia em documento condominial: legibilidade é reputação",
     "Boleto, pasta, comunicado. Onde a escolha de fonte vira confiança ou ruído."),
    ("2025-05-13", "Crescimento", "Funil comercial no ciclo longo do condomínio",
     "Como acompanhar uma venda que leva meses e passa por assembleia."),
    ("2025-05-20", "Digital", "LinkedIn para o mercado condominial: vale a pena?",
     "Onde funciona, onde não funciona, e para quem."),
    ("2025-05-27", "Estrategia", "Prova social no setor condominial sem quebrar sigilo",
     "Como mostrar resultado sem expor o condomínio do cliente."),

    ("2025-06-03", "Posicionamento", "Empresa de tecnologia no mercado condominial: falar com quem?",
     "Síndico, administradora ou condômino. O erro de tentar os três ao mesmo tempo."),
    ("2025-06-10", "Branding", "A promessa que a operação não sustenta",
     "O custo de comunicar um padrão que a entrega não entrega."),
    ("2025-06-17", "Digital", "Reputação online: o que fazer com avaliação ruim no Google",
     "Responder, resolver e o que nunca escrever em público."),
    ("2025-06-24", "Crescimento", "Feiras e eventos do setor: como não desperdiçar o investimento",
     "O que decidir antes, o que levar, e o que fazer nos dez dias seguintes."),

    ("2025-07-01", "Identidade", "Fotografia para empresa condominial: prédio ou pessoa?",
     "O banco de imagens genérico e por que ele apaga a marca."),
    ("2025-07-08", "Estrategia", "Comunicação com o condômino é problema da administradora",
     "Por que a experiência do morador vira reputação da empresa, mesmo sem contrato direto."),
    ("2025-07-15", "Posicionamento", "Auditoria e consultoria condominial: vender o que não se vê",
     "Como comunicar um serviço cujo melhor resultado é o problema que não aconteceu."),
    ("2025-07-22", "Digital", "Newsletter para o mercado condominial: a lista que é sua",
     "Por que e-mail continua sendo o canal mais estável de um mercado de nicho."),

    ("2025-08-05", "Crescimento", "Precificação e percepção de valor: por que o desconto encolhe a marca",
     "O que acontece com o posicionamento cada vez que se concede preço."),
    ("2025-08-12", "Estrategia", "Calendário do setor: os meses que decidem o ano",
     "Assembleia, orçamento, eleição de síndico. Quando falar com quem."),
    ("2025-08-19", "Digital", "Landing page para captação no mercado condominial",
     "A página de destino que transforma anúncio em conversa."),
    ("2025-08-26", "Identidade", "Apresentação comercial: o documento mais visto e menos cuidado",
     "O PDF que circula no conselho e representa a empresa sem ninguém junto."),

    ("2025-09-02", "Posicionamento", "Construtora e incorporadora: comunicar o condomínio antes de existir",
     "Entrega, primeira convenção e a marca que fica depois que a obra sai."),
    ("2025-09-09", "Branding", "Rebranding depois de fusão ou aquisição no setor",
     "O que preservar, o que aposentar e como explicar para a base de clientes."),
    ("2025-09-16", "Crescimento", "CRM para empresa condominial: começar simples e não abandonar",
     "O mínimo que funciona quando o ciclo é longo e o time é pequeno."),
    ("2025-09-23", "Digital", "YouTube no mercado condominial: quem deveria estar lá",
     "Formato longo para um assunto que exige explicação."),

    ("2025-10-07", "Identidade", "Acessibilidade visual: contraste, corpo de texto e leitura em elevador",
     "A parte da identidade que decide se a mensagem chega."),
    ("2025-10-14", "Posicionamento", "O que fazer quando o concorrente copia o seu posicionamento",
     "Por que copiar a superfície nunca copia a posição."),
    ("2025-10-21", "Crescimento", "Retenção vale mais que captação no mercado condominial",
     "O contrato que dura anos e o que o faz não ser renovado."),
    ("2025-10-28", "Branding", "Propósito de marca sem discurso vazio",
     "Como escrever um propósito que orienta decisão em vez de decorar parede."),

    ("2025-11-04", "Digital", "Portal e app do condômino: a marca também mora ali",
     "A interface que o morador usa toda semana e ninguém trata como comunicação."),
    ("2025-11-11", "Estrategia", "Prestação de contas como argumento de venda",
     "O documento mais chato do setor pode ser a melhor prova de competência."),
    ("2025-11-18", "Identidade", "Sinalização interna de condomínio: identidade que convive com o morador",
     "Placas, avisos e comunicação de obra que respeitam quem mora ali."),
    ("2025-11-25", "Crescimento", "Parcerias entre empresas do setor: quando somam e quando confundem",
     "Coo-marketing no mercado condominial sem diluir as duas marcas."),

    ("2025-12-02", "Posicionamento", "Fornecedor estratégico: deixar de ser cotação e virar escolha",
     "O caminho de quem vende para administradoras e quer sair da planilha comparativa."),
    ("2025-12-09", "Branding", "O que o seu contrato comunica sobre a sua marca",
     "Cláusula, linguagem e a primeira impressão do relacionamento longo."),
    ("2025-12-16", "Estrategia", "Balanço do ano: como fazer o retrospecto que serve de conteúdo",
     "Transformar o que aconteceu em prova pública, sem virar autoelogio."),
    ("2025-12-23", "Digital", "Presença digital em dezembro: o mês em que o setor some",
     "Por que sumir no fim do ano custa mais caro do que parece."),

    # ---------------------------------------------------------------- 2026
    ("2026-01-07", "Estrategia", "Planejamento de comunicação para o ano: o documento de uma página",
     "O plano curto que a equipe consulta, contra o plano longo que ninguém abre."),
    ("2026-01-14", "Branding", "Marca em processo de sucessão familiar",
     "Empresas do setor que trocam de geração e o que fazer com o nome do fundador."),
    ("2026-01-28", "Crescimento", "Follow-up: o que fazer nas semanas entre a proposta e a assembleia",
     "O intervalo em que a maior parte das vendas do setor é perdida por silêncio."),

    ("2026-02-25", "Identidade", "Papelaria e modelos: a identidade que a equipe usa todo dia",
     "Modelo de ata, ofício, e-mail e proposta como parte do sistema visual."),

    ("2026-03-18", "Crescimento", "Palestra e webinar como canal comercial no setor",
     "Falar para trinta pessoas certas vale mais que anunciar para trinta mil."),

    ("2026-04-01", "Estrategia", "Como medir comunicação quando o ciclo de venda é longo",
     "Os indicadores que fazem sentido quando a conversão demora meses."),
    ("2026-04-15", "Identidade", "Quando a identidade visual envelhece, e como perceber a tempo",
     "Os sinais de que o sistema não representa mais a empresa."),

    ("2026-05-06", "Digital", "Blog corporativo no mercado condominial: vale o esforço?",
     "O ativo que demora a dar retorno e depois trabalha sozinho por anos."),
    ("2026-05-13", "Posicionamento", "Especialização por tipo de condomínio: residencial, comercial, logístico",
     "Três mercados diferentes com nomes parecidos."),
    ("2026-05-20", "Branding", "O que o silêncio da sua marca comunica",
     "Ficar quieto também é mensagem, e raramente a que se pretende."),
    ("2026-05-27", "Crescimento", "Objeções recorrentes no comercial condominial e como respondê-las antes",
     "As cinco perguntas que aparecem sempre, e o conteúdo que as responde de véspera."),

    ("2026-06-03", "Estrategia", "Comunicação interna: a equipe é o primeiro público da marca",
     "Quem atende o telefone entrega a marca mais do que qualquer campanha."),
    ("2026-06-10", "Digital", "Anúncio no Instagram para síndico: segmentação num público minúsculo",
     "Como chegar a poucos milhares de pessoas certas sem queimar verba."),
    ("2026-06-17", "Identidade", "Ícones e pictogramas para um setor cheio de informação",
     "Sistema visual que organiza comunicado, relatório e app."),
    ("2026-06-24", "Posicionamento", "Manutenção e obras: comunicar competência técnica sem virar catálogo",
     "O equilíbrio entre provar conhecimento e continuar legível."),

    ("2026-07-01", "Branding", "Manifesto de marca: para que serve e quando não escrever um",
     "O texto que alinha a empresa por dentro antes de convencer alguém por fora."),
    ("2026-07-08", "Crescimento", "Do lead ao contrato: o mapa da jornada no mercado condominial",
     "Cada etapa, quem participa e o que precisa existir em cada uma."),
    ("2026-07-15", "Digital", "Google Ads para administradoras: as palavras que valem o clique",
     "Intenção de busca no setor e onde a verba se perde."),
    ("2026-07-22", "Estrategia", "O que fazer quando a comunicação não está dando resultado",
     "Diagnóstico honesto: problema de mensagem, de canal, de oferta ou de operação."),
]


# Pautas boas que sobraram do calendario de 19 meses. Entram quando o blog
# passar de julho de 2026, ou substituem alguma das de cima.
PAUTAS_EXTRAS = [
    ("Branding", "Naming no setor condominial: o que os nomes estão dizendo",
     "Padrões, armadilhas e o teste do telefone."),
    ("Estrategia", "Conteúdo técnico sem afastar quem não é técnico",
     "Como escrever sobre NR, laudo e rateio para quem decide, não para quem executa."),
    ("Identidade", "Um sistema de marca que a equipe consegue aplicar sozinha",
     "Manual curto, modelos prontos e o que realmente sobrevive ao dia a dia."),
]


if __name__ == "__main__":
    from collections import Counter

    todas = [(d, t, n) for d, t, n in PUBLICADAS] + [(d, t, n) for d, t, n, _ in PLANO]
    todas.sort()
    por_mes = Counter(d[:7] for d, _, _ in todas)
    print("materias por mes:")
    for mes in sorted(por_mes):
        marca = "" if por_mes[mes] == 4 else "   <-- fora do padrao de 4"
        print(f"  {mes}: {por_mes[mes]}{marca}")
    print(f"\ntotal: {len(todas)}  |  publicadas: {len(PUBLICADAS)}  |  a escrever: {len(PLANO)}")
    print(f"banco de pautas extras: {len(PAUTAS_EXTRAS)}")
    print("\npor tema:")
    for tema, n in Counter(t for _, t, _ in todas).most_common():
        print(f"  {tema:16} {n}")
