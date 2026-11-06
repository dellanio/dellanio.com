# Publicar o dellanio.com na OCI

O site é estático: `npm run build` gera `dist/` (cerca de 11 MB). Ele roda na VM
`dellanio-host` (OCI, us-ashburn-1, Ubuntu 24.04 ARM, IP 193.122.206.82), atrás
da Cloudflare.

## Como o servidor está montado

- O contêiner `dellanio-site` (nginx) atende as portas 80/443 de **todos** os
  domínios (dellanio.com e os subdomínios f2a-academy, tech-woman, cobra,
  portal-imobiliario, notepad, pgadmin).
- Ele monta `/var/www/dellanio.com` como `/usr/share/nginx/html` e lê a
  configuração de `/var/www/dellanio.com/default.conf` (dono root).
- Essa raiz serve também os desafios do Let's Encrypt de todos os subdomínios
  (`.well-known`): ela não muda.
- O site 3D fica em `/var/www/dellanio.com/site/`: `releases/<data>` para cada
  envio e `current`, um atalho **relativo** (resolve também dentro do contêiner).
- No `default.conf`, só o bloco `dellanio:site-3d` (o `nginx-dellanio.conf`
  daqui) aponta o dellanio.com para `site/current`. O resto do arquivo é dos
  outros sites.

## Publicar uma versão nova

```
deploy/deploy.sh
```

Faz o build, envia para `site/releases/<data>` e troca `current`. Não precisa
recarregar o nginx. As cinco últimas versões ficam guardadas.

## Voltar à versão anterior

```
deploy/deploy.sh --rollback
```

## Mexer no default.conf

O arquivo é montado sozinho no contêiner: edite **no lugar** (reescrevendo o
mesmo arquivo, como `cat novo > default.conf` com sudo), nunca com
ferramentas que criam um arquivo novo (`sed -i`, alguns editores), ou o nginx
continua lendo a versão antiga. Depois:

```
docker exec dellanio-site nginx -t && docker exec dellanio-site nginx -s reload
```

## Backups da troca de 30/10/2026

Em `~/backups` na VM: `dellanio.com-cv-20261030-161439.tgz` (o currículo antigo
inteiro) e `default.conf-20261030-161439` (a configuração antes da troca). Para
voltar ao currículo antigo: restaure esse `default.conf` (no lugar) e recarregue
o nginx.

## Variáveis do script

`HOST` (padrão `ubuntu@193.122.206.82`), `KEY` (`~/.ssh/oci_dellanio`),
`ROOT` (`/var/www/dellanio.com/site`), `KEEP` (5).

## Cloudflare

O `index.html` vai com `no-cache`, então uma versão nova aparece logo. Se algo
ficar preso, use "Purge Everything" no painel da Cloudflare.
