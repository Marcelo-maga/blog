---
title: "Arquitetura Hexagonal"
date: "2026-04-25"
slug: "arquitetura-hexagonal"
authors: ["editorial"]
stream: notas
tags: ["arquitetura-de-software"]
---
Um padrão de arquitetura que permite desacoplar a aplicação do ambiente, através do conceito de Portas e Adaptadores. E sua principal utilidade é solucionar o problema de Acoplamento das aplicações modernas, através do Design Pattern de Inversão de Dependência

## Objetivos
Organizar o código em camadas, tal qual um cebola, cada camada tem sua responsabilidade. 

## Camadas
cada camada é completamente autocontida e isolada do mundo externo e se comunica com outras camadas a partir do conceito de porta e adaptadores.

A ideia é criar portas de entrada, que são definidas por interfaces genéricas que precisam ser implementadas por adaptadores.

## Exemplo
O carregador é um componente que precisa se adaptar o plug de entrada da tomada, que é a Regra de Negocio (Domínio).

Um carregador brasileiro, implementa a tomada brasileira, mas caso preciso utilizar em uma tomara europeia, será necessário um adaptador 
