---
title: Super minigrap
date: 2026-05-21
slug: super-minigrap
tags:
  - rust
  - minigrep
stream: artigos
---
Eitchaa 2 posts em uma semana, sou uma maquina...

# Pq estamos aqui?

Estava aqui agora 22:10 da noite pensando em como eu poderia aplicar tudo que eu andei falando/escrevendo aqui ([[Cognitive Offloading]]) e tentando achar algo interessante que me desse a vontade necessária de construir fora do meu horário de trabalho. E ontem (20/05) e hoje (21/05) foram dias super produtivos lá, onde tive a oportunidade (rsrs) de construir basicamente um fazedor (isso ai que você leu!) de relatórios, onde basicamente, recebo as mensagens em uma fila RabbitMQ e crio o arquivo PDF, através de mágica e chromium, e envio o buffer para ser armazenado no sistema de arquivos da organização do usuário. O detalhe interessante disso tudo é que o worker que faz os PDF é escrito em uma beldade chamada [Rust](https://rust-lang.org/).

O que me acendeu uma vontade imensa de fazer alguma coisa minha aqui na minha casinha, mas tenho uma certa preguiça de desenvolver sistemas web quando o assunto é projetos pessoais, nunca gostei, sempre preferi criar aplicativos desktops

(que inclusive penso em escrever um pouco sobre [Tauri](https://v2.tauri.app/) que bizzaramente tenho muita experiencia e historia pra contar do que eu já passei com esse framework maravilhoso)

E outro mundo da programação que sempre adorei foram as CLI, e revisitando [O Livro](https://doc.rust-lang.org/book/) lembrei de um mini projeto que temos para aprender certos conceitos que aprendemos até aquele momento na leitura, o minigrep. O grep é um comando para pesquisar por padrões de texto em arquivos ou em qualquer coisa que tenha stdout no terminal, muito utilizado quando o desespero bate e voce esta dentro de um SSH com o seu chefe aos prantos por conta da API que caiu e você tem ideia de qual foi o console.log que foi adicionado no ultimo PR que travou o event loop do NodeJS.

# a ideia

enfim, porque não melhorar ele??? então por aqui nas próximas semanas vão ser bem movimentado, a priore eu pensei em torno de 4 artigos seguindo uma completa refatoração do projeto minigrep para transforma ele em... (adivinha o nome super criativo) um super-minigrep.

pensei em aceitar regex (o inferno nos aguarda), múltiplos arquivos sendo processados simultaneamente (Tokio vai ser necessário), um e error handling digno de cinema com anyhow e thiserror e maneiras pintar o terminal para ficar bem legal.

Spolier: O primeiro artigo quero fazer uma analise (pouco aprofundada) do código que temos ao seguir o livro e já começar com pequenas melhorias!

> [!question]- Spolier
> O primeiro artigo quero fazer uma analise (muito aprofundada) do código que temos ao seguir o livro e já começar com pequenas melhorias!

# Conclusão

Já deixei um repositório no [Github](https://github.com/Marcelo-maga/super-minigrep) pronto para começar 

conforme for criando os artigos vou usando esse aqui como um indexador para que seja facilmente localizado nesse mar de texto que vai virar isso aqui!!







