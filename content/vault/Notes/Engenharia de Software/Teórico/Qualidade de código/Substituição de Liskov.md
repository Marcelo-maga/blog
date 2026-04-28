---
title: "Substituição de Liskov"
date: "2026-04-25"
slug: "substituicao-de-liskov"
authors: ["editorial"]
stream: notas
tags: []
---
Seja q(x) uma propriedade que se pode" parece ser o início de uma afirmação ou definição em um contexto matemático ou lógico. Para que seja completa e faça sentido, é preciso entender o que se pretende "pode" significar e qual o contexto em que "q(x)
	Barbara Liskov

### **Resumo**
Basicamente deve se ter um cuidado redobrado ao abstrair classes e sempre pensar se uma alteração vai ou não afetar o comportamento esperado do código cliente, sem ter que adicionar condições ou fazer gambiarra.

Classes filhas ou classes Derivadas nunca devem infringir comportamentos e definições de tipo da classe base ou da interface a qual essas classes implementam.

### **Pré-condição**
A subclasse não pode exigir mais que a classe base exigia.

Não sobrescreva comportamentos, as classes dever ser possível serem substituídas sem surpresas no código cliente, sobrescrever os comportamentos pode ser que gere exceções não esperadas, ferindo o o principio de substituição de Liskov.

### **Pós-condição**
A subclasse não pode reduzir as garantias fornecidas pela classe base após a execução do método.

Não retorne comportamentos inesperados para o seu código cliente

### **Invariância**
A subclasse não pode alterar condições internas que a classe base mantinha constantes.

A regra que não pode ter variação.


