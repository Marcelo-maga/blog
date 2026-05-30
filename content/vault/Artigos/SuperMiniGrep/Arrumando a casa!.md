---
title: Arrumando a Casa
date: 2026-05-30
slug: organize-super-minigrap
tags:
  - rust
stream: artigos
---
Não, eu não quero ajudar você a organizar seu quarto!

# Introdução
Bom, como eu avia dito no artigo anterior tava querendo fazer esse projetinho do grep do Rust e aplicar algumas melhorias nele, e acho que a primeira coisa que devemos fazer quando pensamos em fazer uma refatoração do nível que comentei no artigo anterior (que esta aqui ó: [[Super minigrep]]) é uma organização clara e objetiva, para que assim novos desenvolvedores possam entrar no projeto, e não terem que lidar com arquivos enormes (na medida do possível)

# Código atual

Deixei uma [Branch](https://github.com/Marcelo-maga/super-minigrep/tree/feature/book_code) criada dentro do repositório mas aqui esta uma fotografia digital do estado atual que quero dizer
![Estrutura atual do repo](midia/super-minigrep/{1}.png)

Consegue ver?? como as pessoas vão conseguir trabalhar aqui?? me fala!!! não tem como, então vamos primeiro aplicar melhorias na organização do projeto para ai sim, aplicar melhorias verdadeiras.

# Arquivos que gritam seus nomes

É ISSO QUE NOS QUEREMOS! ARQUIVOS QUE GRITEM SEUS NOMES, SEU CANTO DE GUERRA, PRONTOS PARA A BATALHA!

Se você já leu o capitulo 2 de Clean Code (☝️🤓) sabe oque eu quero dizer aqui, os nomes devem revelar o seu proposito, e creio fielmente nisso, então vamos começar com isso antes de qualquer coisa, sem alterar profundamente o código, isso tem que ficar para depois, para facilitar as mentes mais lentas (eu) e criar até mesmo um histórico de alterações mais tangível e real. 

## Config

Então vamos começar com a configuração, ela é a nossa porta de entrada, crie um arquivo '*config.rs*' e remova toda a parte de configuração e parâmetros da nossa mini CLI de dentro do *lib.rs*, teremos algo assim (caso você não tenha ansiedade e já começou a implementar algo): 

```rust
use std::env;

pub struct Config {
    pub query: String,
    pub filename: String,
    pub case_sensitive: bool,
}

impl Config {
    pub fn new(args: &[String]) -> Result<Config, &str> {
        let mut case_sensitive = false;
        if (args.len() == 4) && (args[3] == "--case-sensitive") {
            case_sensitive = true;
        }
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let filename = args[2].clone();

        if !case_sensitive {
            case_sensitive = !env::var("CASE_SENSITIVE").is_err();
        }

        Ok(Config {
            query,
            filename,
            case_sensitive,
        })
    }
}
```

Com isso temos um arquivo com toda a regra de validação dos argumentos fornecidos pelo nosso usuário, etapa importante para nosso projetos, nossas ideias são enormes para esse projeto, uma CLI precisa de um bom parser de argumentos. (sim sim sim, eu sei que poderíamos estar utilizando [Clap](https://crates.io/crates/clap) para reduzir tudo isso em meras configurações triviais, mas para manter a magia da coisa, vamos manter dessa forma)

## Finder

Sim, eu sei que sou péssimo com nomes (ficou claro com o nome desse projeto), mas acho que esse vai passar bem a vibes que desejamos aqui, um buscador, um achador (é isso ai, kkkk)

Então já sabemos oque temos que fazer, crie um arquivo '*finder.rs*' e vamos encapsular as duas funções de busca que nos foram ensinadas dentro de um struct de mesmo nome, dessa forma nas nossas melhorias futuras tudo vai fazer sentido, tudo! se você tiver um pouco de conhecimento em Rust, deve ter chegado em algo parecido com isso:

```rust 
pub struct Finder;

impl Finder {
    pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
        let mut result = Vec::new();
        for line in contents.lines() {
            if line.contains(query) {
                result.push(line);
            }
        }
        result
    }

    pub fn search_case_insensitive<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
        let mut result = Vec::new();
        for line in contents.lines() {
            if line.to_lowercase().contains(&query.to_lowercase()) {
                result.push(line);
            }
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn case_sensitive() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Duct Tape.";
        assert_eq!(
            vec!["safe, fast, productive."],
            Finder::search(query, contents)
        );
    }

    #[test]
    fn case_insensitive() {
        let query = "rUsT";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Trust me.";
        assert_eq!(
            vec!["Rust:", "Trust me."],
            Finder::search_case_insensitive(query, contents)
        );
    }
}
```

Nossos amigos do livro já deixaram testes feitos, lembra deles? pois então, em Rust deixamos os testes unitários dentro dos próprios arquivos, la em baixo, pode copiar e adaptar pra funcionar com suas próprias structs.

## Lib

Bom se tudo deu certo ai, vamos precisar arrumar aqui também, o coração da CLI vive aqui, onde vamos expor nossas regras de negocio para que seja usavel pelo programa compilado, eu criei um struct chamada *SuperMiniGrep* dentro de '*lib.rs*' e joguei a função *run* dentro dela e arrumei os imports e tudo mais, ficou assim:

```rust
pub mod config;
mod finder;

use crate::config::Config;
use crate::finder::Finder;
use std::error::Error;
use std::fs;

pub struct SuperMiniGrep;

impl SuperMiniGrep {
    pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
        let contents = fs::read_to_string(config.filename)?;

        let result = if config.case_sensitive {
            Finder::search(&config.query, &contents)
        } else {
            Finder::search_case_insensitive(&config.query, &contents)
        };
        for line in result {
            println!("{}", line);
        }

        Ok(())
    }
}
```

Com tudo isso feito, nossa cli já deve compilar, mas primeiros vamos rodar os testes e ver se ta tudo passando né:

![Testes passando tudo OK](midia/super-minigrep/{2}.png)

Tudo certo, nossas alterações não quebraram a CLI no meio, um grande avanço para nós não acha? 

e com tudo isso nossa *main.rs* fica muito parecida, quase que intocada, porem os benefícios vão ser visíveis a longo prazo!

```rust 
use std::env;
use std::process;

use super_minigrep::{SuperMiniGrep, config::Config};

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        process::exit(1);
    });

    if let Err(e) = SuperMiniGrep::run(config) {
        eprintln!("Application error: {}", e);
        process::exit(1);
    }
}
```

# Conclusão

Bom isso aqui ficou maior do que eu esperava, sei que prometi no artigo anterior já fazer melhorias no código em si, mas acho que foi um passo importante para o soberania do super-minigrep.

e foi assim que ficou a estrutura do projeto, podemos fazer muitas outras melhorias, mas com o tempo se tudo ir se encaminhando bem, vamos aplicando elas (como o Cargo Workspaces)

![Estrutura Final](midia/super-minigrep/{3}.png)

Então aqui dou um tchau, beijos!
