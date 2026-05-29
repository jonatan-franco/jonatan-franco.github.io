---
layout: article
title: "Divulgação e Formação Científica: Probabilidade, Dialética e Framing"
author: "Jonatan Franco"
affiliation: "Mestrando em Psicologia Clínica (IPUSP) | CRP 14/11474"
math: true
date: 2026-05-29
---

**Jonatan Franco**  
*Mestrando em Psicologia Clínica (IPUSP) e Psicólogo Clínico – CRP 14/11474*


---
## 1. Sobre Dados

Falar que "os dados provam" alguma coisa é uma mera repetição sem sentido, pois **dado** é apenas o *contradomínio de uma função **f***. O que prova algo é a **informação**, isto é, a ligação (a função) contextualizada entre o evento de um espaço amostral e o número (o dado) que uma agente de conhecimento produz — mas não só: o quanto ela explicita a regra de formação (conhecimento justificado) da função em questão. Isto sim, é prova.


---
## 2. Sobre Distribuição Conjunta e Associação

Primeiro, distribuição conjunta trata do comportamento de duas variáveis quando são combinadas. Podemos pensar no comportamento de duas variáveis categóricas (etnia e escolaridade, por exemplo) ou contínuas (peso [massa] e altura). A associação se trata, portanto, de uma medida de força de relação entre duas ou mais variáveis.

Veja a tabela abaixo.

| Curso               | Masculino | Feminino | Total |
|:--------------------|----------:|---------:|------:|
| Física              | 40        | 25       | 65    |
| Ciências Sociais    | 20        | 25       | 45    |
| **Total**           | 60        | 60       | 120   |

**Tabela 1.** Distribuição dos alunos por curso e sexo.

Essa tabela da distribuição conjunta da proporção de estudantes em cada curso por sexo pode dar resultados diferentes a depender da variável que eu fixar. Por exemplo, se pegarmos a linha do curso "Física" e considerarmos como 100% o tamanho total da amostra advinda dessa categoria[^1], teremos que o curso de Física é composto majoritariamente por homens (61%).

[^1]: O processo é simples: divide-se tudo por 65, multiplica-se por 100 e então tomamos a fração (65/65)×100 como 100% dessa categoria de interesse.

Se eu fixo a coluna das pessoas do sexo masculino, vejo que, de 60 homens, 66% estão no curso de Física; por outro lado, de 50 mulheres, 50% compõem o curso de Física.

Veja como é perfeitamente possível e razoável concluirmos que, ao fixarmos a variável *curso*, dos indivíduos que fazem Física, a minoria é mulher (38%), simplesmente porque estou considerando que o curso é o evento de interesse, cujas realizações se dão em "Física" e "Ciências Sociais". Se, entretanto, escolhermos observar a variável *sexo = masculino*, conto todas as realizações para o evento "Fazer Física" e depois "Fazer Ciências Sociais".

Dentro de cada evento (*Sexo* vs *Curso*) temos tamanhos diferentes de observações: $N_{Homens} = 60$ vs $N_{Mulheres} = 50$, mas as proporções são parecidas (60% e 50%, respectivamente), quando consideramos a probabilidade de cursar Física, isto é, $P(F \mid H)$ e $P(F \mid M)$[^2], dado que o total considerado é o curso de Física.

[^2]: F: Física; H: Homem; M: Mulher.

Uma conclusão possível da nossa análise seria: dentro do grupo de mulheres que estudam, não há predileção por curso, já que observamos que

$$P(F \mid M) \simeq P(CS \mid M)$$

Entretanto, outra possível conclusão seria: da amostra de pessoas que cursam Física, $P(M \mid F) < P(H \mid F)$. Ou seja, se sorteássemos uma pessoa que estuda Física, do total considerado, a probabilidade de ser homem é maior do que a de ser mulher. Poderíamos concluir que o curso é uma variável que afeta a probabilidade de surgir uma mulher na amostra, e a razão é que o ambiente favorece a aparição de homens. Do mesmo modo, seria diferente se fixássemos o 100% como a soma de todas as categorias, e a proporção marginal seria outra[^3].

[^3]: F<sub>abs</sub> = (1/100) Σ *f*<sub>ij</sub>, sendo *f*<sub>ij</sub> a frequência relativa do par das categorias *i* e *j*: (masc, fis) + (fem, fis) + (masc, cs) + (fem, cs) = Total.

Vemos então que a existência e a força de associação entre duas variáveis categóricas (mas o mesmo vale para contínuas) dependem do objetivo de análise de quem pesquisa e a que pergunta se responde. A matemática nada tem de "exata", no sentido lato, e pode facilmente ser manipulada para mostrar o que queremos ver, confirmando nossos vieses, dado o nível de desonestidade ou de ignorância.



## 3. Sobre Lift Ratio

Agora veremos outro exemplo disso: *Lift Ratio*, ou alavancagem. Imagine o seguinte: você deve ao Banco R$ 50,00. Para pagar tal conta, você dispõe de apenas R$ 20,00. Queremos calcular o quanto ainda falta para quitar a dívida. Fazendo uma subtração simples:

$$ QTQ = 20 - 50 = -30 \quad \text{(QTQ: Quantidade a quitar)} $$

Ou seja, ainda faltam 30 reais para quitar a dívida. Ou, de outra forma: dado o que você possui, se você desse ao banco tudo o que tem (20 reais), 30 reais seriam tomados de você ao alcançar esse valor — ou acumulativamente (a cada moeda que juntar, 100% será do banco), ou de supetão. Podes pensar também que 20 reais ficarão em haver se gastares teus 20 com outras coisas e conseguires 30 para o Banco, por algum motivo desconhecido.

Bom, há várias formas de pensar como você irá se complicar nesta dívida — fique à vontade para explorar quantas quiseres.

Agora, façamos o seguinte: quero calcular a proporção do que foi tomado. Então:

$$ \frac{20 - 50}{50} \times 100 = -60\% $$

Ou seja, do total de 50 reais, o Banco está com uma falta de 60%, dado que ainda não recebeu os 30 reais (30/50 = 0,6 = 60%). Agora, façamos outra coisa:

$$ \frac{20 - 50}{20} \times 100 = -150\% $$

Aqui nós estamos calculando a perda tendo como valor de referência o dinheiro disponível a pagar (20 reais). Ou seja, o indivíduo precisa adicionar 150% a mais de dinheiro para quitar a conta — isto é, acumular 1,5× mais do que tem para pagar. Veja como isso reflete exatamente o viés psicofísico de ancoragem e como isso formata dialeticamente o discurso.

Parece uma contradição que haja uma perda de 60% e 150% ao mesmo tempo, mas a dialética é justamente a aparição de uma contradição aparente gerada para uma condição que foi imposta no modelo: a isso damos o nome de *enquadramento*, ou *framing*. O cenário de perda é maior para o framing do indivíduo do que para o framing da empresa. Os dados podem contar histórias diferentes a depender da intenção de quem as conta.


**Como citar este artigo:**  
Franco, J. (2026). Divulgação e Formação Científica: Probabilidade, Dialética e Framing. *Blog Subjetivante*. Disponível em: https://jonatan-franco.github.io/artigos/divulgacao-cientifica

[⬅ Voltar para a lista de artigos](/artigos)