---
title: "Arquitetura Limpa"
date: "2026-04-25"
slug: "arquitetura-limpa"
authors: ["editorial"]
stream: notas
tags: ["arquitetura-de-software"]
---
A Arquitetura Limpa (Clean Architecture) é um padrão proposto por Robert Cecil Martin com o intuito de promover o [[SOLID]], reusabilidade de código e testabilidade.
Pode se encaixar nas Arquiteturas em Camadas.
![arquitetura-limpa-novo.svg](/midia/arquitetura-limpa-novo.svg)

# Camadas
Como dito anteriormente, pode ser considerada uma arquitetura em camadas, por cada coisa em sua composição ser separado e ter um responsabilidade única.
## Entidades e Casos de Usos

Ao centro temos a camada de **Entidades**, responsável por conter toda a regra de negocio, são classes comuns entre sistema de varias empresas. com regras de negócio genéricas para aquela classe.

Já os **Casos de Uso** definem regras de negocio especificas para o negocio de um sistema.
## Adaptadores
Os adaptadores tem a responsabilidade de mediar a comunicação entre as camada externas com as camada internas. por exemplo, uma API REST, recebe a solicitação, converte para os objetos para o body desejado, e ao contrario, do body da persistência para JSON para a API responder.
## Frameworks Externos
Essa camada é responsável por conter todos as classes de bibliotecas, frameworks e persistência em bancos de dados, provedores de pagamento, envio de notificação.

> Todos os detalhes ficam na camada de frameworks e drivers. A Web é um detalhe. O banco de dados é um detalhe. Mantemos essas tecnologias na camada mais externa porque é onde elas podem fazer menos mal.
## Regra de Dependência
Classes X não devem conhecer nenhuma classe da camada Y, Uncle Bob diz:

> O nome de um elemento declarado em uma camada externa não deve ser mencionado pelo código de uma camada interna. Isso inclui funções, classes, variáveis e qualquer outro elemento de código.

Dessa maneira as camadas internas são menos modificadas.

A Regra de Dependência garante que Entidades e Casos de Usos são classes limpas e análoga a tecnologia (Framework) e serviços externos.
## Invertendo o Fluxo de Controle
Uma camada externa Y pode criar um objeto da camada X e utilizar os métodos
Em alguns casos é possível uma classe mais interna utilizar classes de uma camada mais externa  

