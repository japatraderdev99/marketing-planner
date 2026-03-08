

## Diagnóstico: Problemas nas Edge Functions

Após análise detalhada de todas as edge functions, identifiquei **3 problemas concretos** que causam falhas:

### Problema 1: CORS Headers Incompletos (3 funções)
As funções `extract-strategy-metafields`, `fill-playbook-from-knowledge` e `fill-metafields-from-knowledge` têm CORS headers incompletos:
```
// ATUAL (quebra requisições do browser)
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"

// CORRETO (inclui headers do SDK Supabase)
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```
Isso faz com que requisições do browser sejam bloqueadas no preflight OPTIONS.

### Problema 2: `generate-narrative-carousel` não registrada no config.toml
A função foi criada mas nunca adicionada ao `config.toml`, o que significa que não tem `verify_jwt = false` configurado e pode falhar com 401.

### Problema 3: Erro de build (GitHub)
Os erros `"failed to get github access token: installation not found"` são problemas de infraestrutura GitHub, **não de código**. Isso geralmente se resolve sozinho ou precisa reconectar o repositório.

---

### Plano de Correção

1. **Corrigir CORS** em `extract-strategy-metafields`, `fill-playbook-from-knowledge`, `fill-metafields-from-knowledge` — adicionar headers completos
2. **Registrar** `generate-narrative-carousel` no `config.toml`
3. **Re-deploy** todas as funções afetadas
4. **Testar** cada função para confirmar que responde corretamente

### Detalhes Técnicos
- 3 arquivos de edge function editados (somente linha de CORS headers)
- 1 arquivo config.toml editado (adicionar entrada)
- Deploy de 4 funções

