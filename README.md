# Prumo

Painel pessoal para organizar o dia: o app inteiro mora num único `index.html`, sem servidor.

- **Tarefas** com prioridade alta, média e baixa, edição com um clique e "desfazer" ao concluir ou excluir
- **Foco**: timer pomodoro com duração ajustável, tarefa associada e gráfico dos últimos 7 dias
- **Hábitos** com grade da semana e contagem de dias seguidos
- **Notas** com salvamento automático
- **Backup**: exportar e importar os dados num arquivo `.json`

## Como usar

- **No navegador:** acesse https://erosxv.github.io/prumo/. No Chrome ou no Edge, use "Instalar o Prumo" (no rodapé ou na barra de endereço); no celular, "Adicionar à tela inicial". Funciona sem internet depois da primeira visita.
- **App de bandeja (Windows):** baixe [Prumo-Windows.zip](https://erosxv.github.io/prumo/app/Prumo-Windows.zip), extraia numa pasta e abra o `Prumo.exe`. Fechar a janela deixa o Prumo no ícone perto do relógio; para sair de vez, clique no ícone e escolha **Sair**. Usa cerca de 75 MB de memória.
  O Windows pode avisar que o app não é reconhecido (ele não tem assinatura digital paga): clique em **Mais informações → Executar assim mesmo**.

Atalho: tecla `N` para escrever uma nova tarefa.

## Atualizações

- O site avisa quando há versão nova ("Atualizar agora").
- O app de bandeja procura atualização ao abrir e a cada 6 horas, instala sozinho e reinicia quando a janela está escondida.

## Onde ficam os dados

Tudo fica no aparelho de cada pessoa: no navegador (`localStorage`) ou, no app de bandeja, na pasta do usuário do Windows. Nada é enviado para servidor nenhum, e cada pessoa tem o seu próprio Prumo.
Dados não passam sozinhos de um navegador ou aparelho para outro: use **Exportar dados** num e **Importar dados** no outro.

## Para quem mexe no código

- `index.html`: o app (HTML, CSS e JS). `sw.js` + `manifest.webmanifest`: instalação e uso sem internet.
- `desktop/`: app de bandeja feito com [Neutralinojs](https://neutralino.js.org/) (usa o WebView2 que já vem no Windows). `desktop/resources/desktop.js` liga o Prumo à bandeja, às notificações e à atualização automática.
- `icons/`: gerados por `python tools/make_icons.py`.
- **Publicar uma versão nova:** `npm install` (uma vez), depois `npm run release -- 1.2.0`, e então commit e push. O script grava o número da versão em todos os lugares, gera o app e coloca em `app/` o zip, o `resources.neu` e o `update.json` que os apps instalados leem.
