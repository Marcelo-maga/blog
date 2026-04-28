---
title: "Terraform"
date: "2026-04-25"
slug: "terraform"
authors: ["editorial"]
stream: notas
tags: ["devops"]
---
# Aula 1 - Introdução ao Terraform

Terraform funciona totalmente com a Cloud
### Linguagem HCL
Hashicortp Configuration Language

HCL -> é simples 


Uma mistura de json e yml

https://registry.terraform.io/providers/hashicorp/aws/latest/docs

De acordo com a cloud, algumas cosias podem mudar, porem a ideia é ser  o mínimo diferente possível 

# Aula 2 - Providers e Backend

Provider -> São APIs do provedores de cloud, como a AWS e Azure
Baixa um SDK para executar comandos da cloud selecionada


Resources -> Manifesto k8s -> Cluster

State -> O coração do terraform, terraform.tfstate, o arquivo de estado, com os dados sensíveis da infra, se o arquivo for corrompido, ele vai criar tudo do zero 

bakend -> armazena o state de maneira segura, pode ser um S3 que armazena os arquivos

# Aula 3 - Principais Comandos

terraform init -> iniciamos o repositório baixando todos os pacotes

terraform plan -> simula a criação, mostra oque sera criado, sem executar, fica na pipeline CI

terraform apply -> cria a infra de vdd




