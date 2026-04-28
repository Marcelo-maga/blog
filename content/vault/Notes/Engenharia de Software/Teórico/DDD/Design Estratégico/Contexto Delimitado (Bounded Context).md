---
title: "Contexto Delimitado (Bounded Context)"
date: "2026-04-25"
slug: "contexto-delimitado-bounded-context"
authors: ["editorial"]
stream: notas
tags: ["ddd"]
---
⚠ Importante: Um contexto delimitado é sempre trabalhado por um time, nunca deve ser compartilhado entre dois, mas um time pode trabalhar em diversos contextos. 

São limites que não são definidos pelos subdomínios, podem ser identificados ao analisar o negocio.

- Não existe uma regra para definir o tamanho de um contexto delimitado, tudo vai depender de como o arquiteto analisa e identifica esses contextos. Se a termologia entre dois contextos forem muito parecidas, é uma boa ideia juntar os dois em um contexto delimitado, e o contrario também vale, caso a termologia seja muito diferente, vale a pena em separa em contextos diferentes.

- A quantidade não é fixa, e varia de acordo com a necessidade do negocio, e não por ser um contexto muito grande precise de um time grande de desenvolvimento, as vezes existem muitas coisas dependentes e não acelerara o desenvolvimento.

- O numero de contextos pode definir a quantidades de times que vão participar do desenvolvimento, mas não necessariamente será exatamente isso.

- Se a aplicação for pequena o suficiente, um único contexto pode englobar a aplicação inteira 

Essa separação é necessária pois os time criam uma linguagem própria para se comunicar, atrelada a Linguagem Ubíqua e os processos do negocio que estão trabalhando.

# Trabalhando com Contextos Delimitados
Para fazer a integração de diversos contextos delimitados e consequentemente times diferentes devemos nos atentar e escolher um modelo de integração, e para cada modelo ele supre a necessidade especifica de um cenário.




