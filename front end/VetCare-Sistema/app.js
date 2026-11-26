/* NexoVet - interface integrada à API Java/Spring Boot. */
const API_BASE = 'http://localhost:8081';
const ENDPOINTS = {
    animais: '/api/animais',
    tutores: '/api/tutores',
    veterinarios: '/api/veterinarios',
    consultas: '/api/consultas',
    vacinas: '/api/vacinas',
    especies: '/api/especies',
    racas: '/api/racas',
    integracoes: '/api/integracoes-governo',
    enderecos: '/api/enderecos',
    login: '/api/veterinarios/login'
};

const state = { page: 'inicio', data: {}, editing: null, editingId: null, activeVeterinarianId: null };
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = v => v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '—';
const titleCase = v => String(v ?? '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
const endpoint = page => ENDPOINTS[page];

async function api(path, options = {}) {
    const user = JSON.parse(localStorage.getItem('vetcare_user') || 'null');
    const authHeader = user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...authHeader, ...(options.headers || {}) }
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('vetcare_user');
        window.location.replace('login.html');
        return;
    }

    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

    if (!response.ok) {
        const message = data?.detail || data?.title || data?.message || data?.userMessage || raw || `Erro HTTP ${response.status}`;
        throw new Error(message);
    }
    return data;
}

function clearModalAlert() {
    const alertBox = $('#modalAlert');
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }
}

function toast(message, type = 'ok') {
    const dialog = $('#formDialog');
    const alertBox = $('#modalAlert');
    if (type === 'error' && dialog?.open && alertBox) {
        alertBox.textContent = message;
        alertBox.style.display = 'block';
        dialog.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = message;
    $('#toastRegion').append(el);
    setTimeout(() => el.remove(), 4200);
}

function setApiStatus(online) {
    $('#apiDot').className = online ? 'online' : 'offline';
    $('#apiStatus').textContent = online ? 'API conectada' : 'API indisponível';
}

async function load(page) {
    if (page === 'inicio') {
        await Promise.all(['animais', 'tutores', 'veterinarios', 'consultas', 'vacinas', 'integracoes'].map(loadCollection));
        return;
    }
    if (page === 'cadastros') {
        await Promise.all(['especies', 'racas'].map(loadCollection));
        return;
    }
    await loadCollection(page);
}

async function loadCollection(page) {
    try {
        state.data[page] = await api(endpoint(page));
        if (!Array.isArray(state.data[page])) state.data[page] = [];
    } catch (e) {
        state.data[page] = [];
        console.warn(page, e.message);
    }
}

function navigate(page) {
    state.page = page;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $('#pageTitle').textContent = ({
        inicio: 'Visão geral',
        animais: 'Animais',
        tutores: 'Tutores',
        veterinarios: 'Veterinários',
        consultas: 'Consultas',
        vacinas: 'Vacinas',
        integracoes: 'Integração com o governo',
        cadastros: 'Espécies e raças'
    })[page];
    $('#sidebar').classList.remove('open');
    render();
}

function statCard(label, value, icon, note = 'Registros cadastrados') {
    return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`;
}

function renderHome() {
    const a = state.data.animais || [], t = state.data.tutores || [], v = state.data.veterinarios || [], c = state.data.consultas || [], vacs = state.data.vacinas || [], ints = state.data.integracoes || [];
    const proximasDoses = vacs
        .filter(x => x.dataProximaDose && x.situacao !== 'CANCELADA')
        .sort((x, y) => String(x.dataProximaDose).localeCompare(String(y.dataProximaDose)))
        .slice(0, 4);
    const pendentesGov = ints.filter(x => ['FALHA', 'PENDENTE', 'ENVIADO'].includes(x.situacao)).length;

    return `
        <div class="welcome">
            <div>
                <h2>Olá! Bem-vindo à NexoVet.</h2>
                <p>Acompanhe os indicadores clínicos, reforços vacinais e sincronizações governamentais.</p>
            </div>
            <button class="btn btn-primary" onclick="navigate('animais')">＋ Cadastrar animal</button>
        </div>
        <div class="stats-grid">
            ${statCard('Animais', a.length, '🐾')}
            ${statCard('Tutores', t.length, '♙')}
            ${statCard('Veterinários', v.length, '⚕')}
            ${statCard('Consultas', c.length, '▣')}
        </div>
        <div class="dashboard-grid">
            <section class="panel">
                <h3>Resumo da operação</h3>
                <div class="quick-list">
                    <div class="quick-row"><span class="muted">Vacinas registradas</span><strong>${vacs.length}</strong></div>
                    <div class="quick-row"><span class="muted">Integrações confirmadas</span><strong>${ints.filter(x => x.situacao === 'CONFIRMADA').length}</strong></div>
                    <div class="quick-row"><span class="muted">Integrações pendentes / falha</span><strong>${pendentesGov}</strong></div>
                    <div class="quick-row"><span class="muted">Consultas agendadas</span><strong>${c.filter(x => x.situacao === 'AGENDADA').length}</strong></div>
                </div>
            </section>
            <section class="panel">
                <h3>Próximas doses previstas</h3>
                <div class="quick-list">
                    ${proximasDoses.length
        ? proximasDoses.map(vac => `<div class="quick-row"><div><strong>${esc(displayName('animais', vac.animalId))}</strong><div class="muted">${esc(vac.nomeVacina)}</div></div><span class="badge warn">${fmtDate(vac.dataProximaDose)}</span></div>`).join('')
        : '<div class="muted" style="padding:8px 0;">Nenhuma próxima dose programada.</div>'}
                </div>
            </section>
        </div>`;
}

const configs = {
    animais: { title: 'Animais', singular: 'animal', fields: [['nome', 'Nome do animal', 'text', true], ['dataNascimento', 'Data de nascimento', 'date'], ['idadeEstimadaMeses', 'Idade estimada (meses)', 'number'], ['sexo', 'Sexo', 'select', true, ['MACHO', 'FEMEA', 'INDEFINIDO']], ['cor', 'Cor', 'text'], ['pesoAtual', 'Peso atual (kg)', 'number'], ['tutorId', 'Tutor responsável', 'select', true, 'tutores'], ['especieId', 'Espécie', 'select', true, 'especies'], ['racaId', 'Raça (opcional)', 'select', false, 'racas']] },
    tutores: { title: 'Tutores', singular: 'tutor', fields: [['nomeCompleto', 'Nome completo', 'text', true], ['cpf', 'CPF (somente números)', 'text', true], ['dataNascimento', 'Data de nascimento', 'date', true], ['email', 'E-mail', 'email', true], ['telefone', 'Telefone', 'tel', true], ['cep', 'CEP', 'cep', true], ['logradouro', 'Logradouro', 'text'], ['numero', 'Número', 'text', true], ['complemento', 'Complemento', 'text'], ['bairro', 'Bairro', 'text'], ['cidade', 'Cidade', 'text'], ['uf', 'UF', 'text']] },
    //veterinarios: { title: 'Veterinários', singular: 'veterinário', fields: [['nomeCompleto', 'Nome completo', 'text', true], ['cpf', 'CPF (somente números)', 'text', true], ['crmvNumero', 'Número CRMV', 'text', true], ['crmvUf', 'UF CRMV', 'text', true], ['email', 'E-mail', 'email', true], ['telefone', 'Telefone', 'tel'], ['senha', 'Senha inicial', 'password', true]] },
    veterinarios: { title: 'Veterinários', singular: 'veterinário', fields: [['nomeCompleto', 'Nome completo', 'text', true], ['cpf', 'CPF (somente números)', 'text', true], ['crmvNumero', 'Número CRMV', 'text', true], ['crmvUf', 'UF CRMV', 'text', true], ['email', 'E-mail', 'email', true], ['telefone', 'Telefone', 'tel'], ['senha', 'Senha (deixe vazio para manter)', 'password', false], ['situacao', 'Situação', 'select', false, ['ATIVO', 'INATIVO']]] },
    consultas: { title: 'Consultas', singular: 'consulta', fields: [['animalId', 'Animal', 'select', true, 'animais'], ['veterinarioId', 'Veterinário', 'select', true, 'veterinarios'], ['dataHora', 'Data e hora', 'datetime-local', true], ['motivo', 'Motivo', 'text', true], ['anamnese', 'Anamnese', 'textarea'], ['sintomas', 'Sintomas', 'textarea'], ['diagnostico', 'Diagnóstico', 'textarea'], ['tratamento', 'Tratamento', 'textarea'], ['prescricao', 'Prescrição', 'textarea'], ['pesoKg', 'Peso (kg)', 'number'], ['temperaturaC', 'Temperatura (°C)', 'number'], ['observacoes', 'Observações', 'textarea'], ['situacao', 'Situação', 'select', false, ['AGENDADA', 'REALIZADA', 'CANCELADA']]] },
    vacinas: { title: 'Vacinas', singular: 'vacina', fields: [['animalId', 'Animal', 'select', true, 'animais'], ['veterinarioId', 'Veterinário', 'select', true, 'veterinarios'], ['nomeVacina', 'Nome da vacina', 'text', true], ['tipoVacina', 'Tipo da vacina', 'text', true], ['antirrabica', 'É antirrábica?', 'select', true, ['true', 'false']], ['fabricante', 'Fabricante', 'text', true], ['numeroLote', 'Número do lote', 'text', true], ['dataAplicacao', 'Data de aplicação', 'date'], ['dose', 'Dose', 'text'], ['viaAplicacao', 'Via de aplicação', 'text'], ['dataProximaDose', 'Próxima dose', 'date'], ['validadeLote', 'Validade do lote', 'date', true], ['observacoes', 'Observações', 'textarea'], ['situacao', 'Situação', 'select', false, ['AGENDADA', 'APLICADA', 'CANCELADA']]] },
    especies: { title: 'Espécies', singular: 'espécie', fields: [['nome', 'Nome', 'text', true], ['descricao', 'Descrição', 'text'], ['situacao', 'Situação', 'select', false, ['ATIVO', 'INATIVO']]] },
    racas: { title: 'Raças', singular: 'raça', fields: [['nome', 'Nome', 'text', true], ['descricao', 'Descrição', 'text'], ['especieId', 'Espécie', 'select', true, 'especies'], ['situacao', 'Situação', 'select', false, ['ATIVO', 'INATIVO']]] }
};

function badge(value) {
    const v = String(value || '—');
    let cl = '';
    if (['INATIVO', 'CANCELADA', 'ERRO', 'FALHA'].includes(v)) cl = 'danger';
    else if (['PENDENTE', 'AGENDADA', 'PROCESSANDO', 'ENVIADO'].includes(v)) cl = 'warn';
    return `<span class="badge ${cl}">${esc(titleCase(v))}</span>`;
}

function displayName(page, id) {
    const row = (state.data[page] || []).find(x => String(x.id) === String(id));
    return row?.nomeCompleto || row?.nome || row?.codigoMicrochip || `#${id ?? '—'}`;
}

function rowsFor(page) { return state.data[page] || []; }

function tablePage(page) {
    const cfg = configs[page], rows = rowsFor(page);
    const search = page === 'animais'
        ? '<input class="search-box" id="tableSearch" placeholder="Buscar animal por nome...">'
        : '<input class="search-box" id="tableSearch" placeholder="Buscar registro...">';
    return `<div class="page-toolbar"><h2>${cfg.title}</h2><div style="display:flex;gap:9px;flex-wrap:wrap">${search}<button class="btn btn-primary" onclick="openCreate('${page}')">＋ Novo ${cfg.singular}</button></div></div><div class="table-card"><div class="table-wrap"><table><thead><tr>${headersFor(page).map(h => `<th>${h}</th>`).join('')}<th>Ações</th></tr></thead><tbody id="tableBody">${rows.map(r => rowHtml(page, r)).join('') || `<tr><td colspan="9"><div class="empty">Nenhum registro encontrado. Clique em “Novo ${cfg.singular}” para começar.</div></td></tr>`}</tbody></table></div></div>`;
}

function headersFor(p) {
    return ({
        animais: ['Animal', 'Espécie', 'Tutor', 'Sexo', 'Peso', 'Situação'],
        tutores: ['Tutor', 'CPF', 'E-mail', 'Telefone', 'Cidade', 'Situação'],
        veterinarios: ['Veterinário', 'CRMV', 'E-mail', 'Telefone', 'Situação', 'Cadastro'],
        consultas: ['Animal', 'Veterinário', 'Data e hora', 'Motivo', 'Situação'],
        vacinas: ['Vacina', 'Animal', 'Aplicação', 'Próxima dose', 'Antirrábica', 'Situação'],
        especies: ['Espécie', 'Descrição', 'Situação'],
        racas: ['Raça', 'Espécie', 'Descrição', 'Situação']
    })[p];
}

function rowHtml(p, r) {
    let cells = [];
    if (p === 'animais') cells = [`<strong>${esc(r.nome)}</strong><div class="muted">ID ${r.id}</div>`, esc(r.especieNome || '—'), esc(r.tutorNome || displayName('tutores', r.tutorId)), titleCase(r.sexo), r.pesoAtual ? `${esc(r.pesoAtual)} kg` : '—', badge(r.situacao)];
    if (p === 'tutores') cells = [`<strong>${esc(r.nomeCompleto)}</strong>`, esc(r.cpf), esc(r.email), esc(r.telefone), esc(r.endereco?.cidade || '—'), badge(r.situacao)];
    if (p === 'veterinarios') cells = [`<strong>${esc(r.nomeCompleto)}</strong>`, `CRMV ${esc(r.crmvNumero)}/${esc(r.crmvUf)}`, esc(r.email), esc(r.telefone), badge(r.situacao), fmtDate(r.dataCadastro)];
    if (p === 'consultas') cells = [esc(displayName('animais', r.animalId)), esc(displayName('veterinarios', r.veterinarioId)), esc(String(r.dataHora || '').replace('T', ' ').slice(0, 16)), esc(r.motivo), badge(r.situacao)];
    if (p === 'vacinas') cells = [`<strong>${esc(r.nomeVacina)}</strong><div class="muted">${esc(displayName('veterinarios', r.veterinarioId))}</div>`, esc(displayName('animais', r.animalId)), fmtDate(r.dataAplicacao), fmtDate(r.dataProximaDose), r.antirrabica ? 'Sim' : 'Não', badge(r.situacao)];
    if (p === 'especies') cells = [`<strong>${esc(r.nome)}</strong>`, esc(r.descricao), badge(r.situacao)];
    if (p === 'racas') cells = [`<strong>${esc(r.nome)}</strong>`, esc(r.especieNome || displayName('especies', r.especieId)), esc(r.descricao), badge(r.situacao)];

    const extra = p === 'animais'
        ? `<button class="table-action" onclick="openMicrochip(${r.id})">Microchip</button><button class="table-action" onclick="showHistory(${r.id})">Prontuário</button>`
        : '';
    return `<tr data-search="${esc(JSON.stringify(r).toLowerCase())}">${cells.map(c => `<td>${c}</td>`).join('')}<td><div class="actions">${extra}<button class="table-action" onclick="editRecord('${p}',${r.id})">Editar</button><button class="table-action" onclick="deleteRecord('${p}',${r.id})">Excluir</button></div></td></tr>`;
}

function render() {
    const p = state.page;
    $('#pageContent').innerHTML = p === 'inicio'
        ? renderHome()
        : p === 'integracoes'
            ? renderIntegrations()
            : p === 'cadastros'
                ? `<div class="welcome"><div><h2>Cadastros auxiliares</h2><p>Gerencie espécies e raças disponíveis nos formulários.</p></div></div><div class="dashboard-grid"><section>${tablePage('especies')}</section><section>${tablePage('racas')}</section></div>`
                : tablePage(p);
    const search = $('#tableSearch');
    if (search) search.addEventListener('input', () => { $$('#tableBody tr').forEach(tr => tr.hidden = !tr.dataset.search.includes(search.value.toLowerCase())); });
}

async function refreshIntegrations() {
    await load('integracoes');
    render();
    toast('Status das integrações atualizado.');
}

function renderIntegrations() {
    const list = rowsFor('integracoes');
    return `
        <div class="welcome">
            <div>
                <h2>Integração com o governo</h2>
                <p>Acompanhe os envios de animais e vacinas antirrábicas ao serviço governamental.</p>
            </div>
            <div style="display:flex;gap:9px;flex-wrap:wrap">
                <button class="btn btn-light" onclick="refreshIntegrations()">↻ Atualizar status</button>
                <button class="btn btn-primary" onclick="openIntegration()">＋ Nova solicitação</button>
            </div>
        </div>
        <div class="table-card">
            ${list.length ? list.map(i => `
                <div class="integration-card">
                    <div>
                        <b>${esc(titleCase(i.tipoOperacao))} — ${esc(displayName('animais', i.animalId))}</b>
                        <div class="muted">Animal #${esc(i.animalId)} • Solicitação: ${fmtDate(i.dataSolicitacao)} • Tentativas: ${esc(i.tentativas ?? 0)}</div>
                        <small class="muted">Chave: ${esc(i.chaveIdempotencia || '—')} • ${esc(i.mensagemErro || (i.protocoloExterno ? `Protocolo: ${i.protocoloExterno}` : 'Aguardando resposta'))}</small>
                    </div>
                    <div>${badge(i.situacao)}</div>
                </div>`).join('') : '<div class="empty">Nenhuma solicitação de integração registrada.</div>'}
        </div>`;
}

function fieldHtml(f, value = '') {
    const [name, label, type, required, source] = f;
    let html = '';
    if (type === 'select') {
        let opts = Array.isArray(source) ? source.map(x => [x, titleCase(x)]) : rowsFor(source).map(x => [x.id, x.nomeCompleto || x.nome]);
        html = `<select name="${name}" ${required ? 'required' : ''}><option value="">Selecione...</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(value) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    } else if (type === 'textarea') {
        html = `<textarea name="${name}">${esc(value)}</textarea>`;
    } else {
        html = `<input name="${name}" type="${type === 'cep' ? 'text' : type}" ${required ? 'required' : ''} value="${esc(value)}" ${type === 'cep' ? 'inputmode="numeric" maxlength="9" placeholder="00000-000"' : ''} ${type === 'number' ? 'step="any" min="0"' : ''}>`;
    }
    return `<div class="field ${type === 'textarea' ? 'full' : ''}"><label>${label}${required ? ' *' : ''}</label>${html}</div>`;
}

function openCreate(page) { openForm(page, null); }
function editRecord(page, id) { const r = rowsFor(page).find(x => x.id === id); if (r) openForm(page, r); }

function openForm(page, record) {
    clearModalAlert();
    state.editing = page;
    state.editingId = record?.id ?? null;
    const cfg = configs[page];
    $('#modalEyebrow').textContent = record ? 'EDITAR REGISTRO' : 'NOVO CADASTRO';
    $('#modalTitle').textContent = record ? `Editar ${cfg.singular}` : `Cadastrar ${cfg.singular}`;
    $('#saveButton').textContent = record ? 'Salvar alterações' : 'Salvar registro';

    let values = { ...(record || {}) };
    if (!record && (page === 'consultas' || page === 'vacinas') && state.activeVeterinarianId) {
        values.veterinarioId = state.activeVeterinarianId;
    }
    if (page === 'tutores' && record?.endereco) Object.assign(values, record.endereco);

    $('#modalFields').innerHTML = cfg.fields.map(f => fieldHtml(f, values[f[0]] ?? '')).join('');
    if (page === 'tutores') $('#modalFields').insertAdjacentHTML('beforeend', '<div class="field full"><small>Digite o CEP com 8 números. O endereço será preenchido automaticamente pelo ViaCEP; se a consulta falhar, complete os campos manualmente.</small></div>');
    if (page === 'animais') $('#modalFields').insertAdjacentHTML('beforeend', '<div class="field full"><small>O microchip é cadastrado separadamente para preservar o histórico de vínculos e substituições.</small></div>');
    if (page === 'veterinarios') $('#modalFields').insertAdjacentHTML('beforeend', '<div class="field full"><small>Após o cadastro, o veterinário pode confirmar o e-mail na tela de login para habilitar o acesso.</small></div>');

    $('#formDialog').showModal();
    const cep = $('[name="cep"]');
    if (cep) {
        cep.addEventListener('blur', () => lookupCep(cep.value));
        cep.addEventListener('input', () => {
            let n = cep.value.replace(/\D/g, '').slice(0, 8);
            cep.value = n.length > 5 ? n.slice(0, 5) + '-' + n.slice(5) : n;
        });
    }
}

async function lookupCep(value) {
    const cep = value.replace(/\D/g, '');
    if (!cep) return;
    if (cep.length !== 8) { toast('Informe um CEP com 8 dígitos.', 'error'); return; }
    const form = $('#entityForm');
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('Serviço ViaCEP indisponível.');
        const d = await res.json();
        if (d.erro) throw new Error('CEP não encontrado. Preencha o endereço manualmente.');
        for (const [name, val] of Object.entries({ logradouro: d.logradouro, bairro: d.bairro, cidade: d.localidade, uf: d.uf })) {
            const input = form.elements[name];
            if (input) input.value = val || '';
        }
        toast('Endereço preenchido pelo ViaCEP.');
    } catch (e) {
        toast(e.name === 'AbortError' ? 'Tempo limite da consulta. Preencha o endereço manualmente.' : e.message, 'error');
    }
}

function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }

async function saveEntity(event) {
    event.preventDefault();
    const page = state.editing, cfg = configs[page], values = formObject(event.currentTarget);
    try {
        let payload = {...values};
        for (const f of cfg.fields) {
            const [name, , type] = f;
            if (type === 'number' && payload[name] === '') payload[name] = null;
            if (type === 'number' && payload[name] != null) payload[name] = Number(payload[name]);
            if (type === 'select' && name !== 'sexo' && name !== 'situacao' && name !== 'antirrabica' && payload[name] !== '') payload[name] = Number(payload[name]);
        }
        if (page === 'vacinas') payload.antirrabica = payload.antirrabica === 'true';
        if (page === 'tutores') {
            const address = {
                cep: payload.cep,
                logradouro: payload.logradouro,
                numero: payload.numero,
                complemento: payload.complemento,
                bairro: payload.bairro,
                cidade: payload.cidade,
                uf: payload.uf
            };
            const saved = await api(ENDPOINTS.enderecos, {method: 'POST', body: JSON.stringify(address)});
            payload.enderecoId = saved.id;
            delete payload.cep;
            delete payload.logradouro;
            delete payload.numero;
            delete payload.complemento;
            delete payload.bairro;
            delete payload.cidade;
            delete payload.uf;
        }
        if (page === 'veterinarios') {
            if (!state.editingId && !payload.senha) {
                throw new Error('Informe a senha inicial para cadastrar o veterinário.');
            }
            if (state.editingId && !payload.senha) {
                delete payload.senha;
            }
        }
        const url = endpoint(page) + (state.editingId ? `/${state.editingId}` : '');
        await api(url, {method: state.editingId ? 'PUT' : 'POST', body: JSON.stringify(payload)});
        $('#formDialog').close();
        toast(`${cfg.singular[0].toUpperCase() + cfg.singular.slice(1)} salvo com sucesso.`);
        await load(page);
        if (page === 'vacinas') await loadCollection('integracoes');
        render();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteRecord(page, id) {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
        await api(`${endpoint(page)}/${id}`, { method: 'DELETE' });
        toast('Registro excluído.');
        await load(page);
        render();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function openMicrochip(animalId) {
    clearModalAlert();
    const vets = rowsFor('veterinarios').filter(v => v.situacao !== 'INATIVO');
    if (!vets.length) { toast('Cadastre um veterinário ativo antes de vincular o microchip.', 'error'); return; }
    $('#modalEyebrow').textContent = 'IDENTIFICAÇÃO RFID';
    $('#modalTitle').textContent = `Vincular microchip ao animal #${animalId}`;
    $('#saveButton').textContent = 'Vincular microchip';
    $('#modalFields').innerHTML = `<div class="field full"><label>Código único do microchip *</label><input name="codigoMicrochip" required maxlength="80" placeholder="Digite ou leia o código RFID"></div><div class="field full"><label>Veterinário responsável *</label><select name="veterinarioId" required><option value="">Selecione...</option>${vets.map(v => `<option value="${v.id}" ${String(v.id) === String(state.activeVeterinarianId) ? 'selected' : ''}>${esc(v.nomeCompleto)} — CRMV ${esc(v.crmvNumero)}/${esc(v.crmvUf)}</option>`).join('')}</select></div><div class="field full"><small>O vínculo anterior permanece no histórico de rastreabilidade.</small></div>`;
    state.editing = 'microchip';
    state.editingId = animalId;
    $('#formDialog').showModal();
}

function switchRecordTab(tabName) {
    $$('.record-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    $$('.record-pane').forEach(pane => pane.classList.toggle('active', pane.id === `pane-${tabName}`));
}

async function showHistory(animalId) {
    const animal = rowsFor('animais').find(a => a.id === animalId);
    $('#historyModalTitle').textContent = animal ? `Prontuário — ${animal.nome}` : `Prontuário — Animal #${animalId}`;
    $('#historyContent').innerHTML = '<div class="loading">Carregando prontuário completo...</div>';
    $('#historyDialog').showModal();

    await Promise.all(['consultas', 'vacinas', 'integracoes'].map(loadCollection));

    let microchips = [];
    try {
        microchips = await api(`/api/animais/${animalId}/microchip/historico`);
        if (!Array.isArray(microchips)) microchips = [];
    } catch {
        microchips = [];
    }

    const consultas = rowsFor('consultas').filter(c => String(c.animalId) === String(animalId));
    const vacinas = rowsFor('vacinas').filter(v => String(v.animalId) === String(animalId));
    const integracoes = rowsFor('integracoes').filter(i => String(i.animalId) === String(animalId));

    const chipHtml = microchips.length
        ? microchips.map(x => `<div class="history-item"><div><b>${esc(x.codigoMicrochip)}</b><div class="muted">Vínculo: ${esc(new Date(x.dataVinculo).toLocaleString('pt-BR'))}</div><small class="muted">${esc(displayName('veterinarios', x.veterinarioId))}</small></div><div>${x.dataFim ? `<span class="badge warn">Encerrado ${fmtDate(x.dataFim)}</span>` : '<span class="badge">Ativo</span>'}</div></div>`).join('')
        : '<div class="empty">Nenhum microchip vinculado a este animal.</div>';

    const consultasHtml = consultas.length
        ? consultas.map(c => `<div class="history-item"><div><b>${esc(c.motivo)}</b><div class="muted">${esc(String(c.dataHora || '').replace('T', ' ').slice(0, 16))} • ${esc(displayName('veterinarios', c.veterinarioId))}</div><small class="muted">Diagnóstico: ${esc(c.diagnostico || '—')} | Tratamento: ${esc(c.tratamento || '—')}</small></div><div>${badge(c.situacao)}</div></div>`).join('')
        : '<div class="empty">Nenhuma consulta registrada para este animal.</div>';

    const vacinasHtml = vacinas.length
        ? vacinas.map(v => `<div class="history-item"><div><b>${esc(v.nomeVacina)} ${v.antirrabica ? '(Antirrábica)' : ''}</b><div class="muted">Aplicação: ${fmtDate(v.dataAplicacao)} • Lote: ${esc(v.numeroLote)} (${esc(v.fabricante)})</div><small class="muted">Próxima dose: ${fmtDate(v.dataProximaDose)}</small></div><div>${badge(v.situacao)}</div></div>`).join('')
        : '<div class="empty">Nenhuma vacina registrada para este animal.</div>';

    const govHtml = integracoes.length
        ? integracoes.map(i => `<div class="history-item"><div><b>${esc(titleCase(i.tipoOperacao))}</b><div class="muted">Solicitado em: ${fmtDate(i.dataSolicitacao)} • Tentativas: ${esc(i.tentativas ?? 0)}</div><small class="muted">${esc(i.mensagemErro || (i.protocoloExterno ? `Protocolo: ${i.protocoloExterno}` : 'Sem protocolo ainda'))}</small></div><div>${badge(i.situacao)}</div></div>`).join('')
        : '<div class="empty">Nenhuma comunicação governamental registrada para este animal.</div>';

    $('#historyContent').innerHTML = `
        <div class="record-tabs">
            <button type="button" class="record-tab active" data-tab="chips" onclick="switchRecordTab('chips')">Microchips (${microchips.length})</button>
            <button type="button" class="record-tab" data-tab="consultas" onclick="switchRecordTab('consultas')">Consultas (${consultas.length})</button>
            <button type="button" class="record-tab" data-tab="vacinas" onclick="switchRecordTab('vacinas')">Vacinas (${vacinas.length})</button>
            <button type="button" class="record-tab" data-tab="governo" onclick="switchRecordTab('governo')">Integração Gov (${integracoes.length})</button>
        </div>
        <div class="record-pane active" id="pane-chips">${chipHtml}</div>
        <div class="record-pane" id="pane-consultas">${consultasHtml}</div>
        <div class="record-pane" id="pane-vacinas">${vacinasHtml}</div>
        <div class="record-pane" id="pane-governo">${govHtml}</div>
    `;
}

async function openIntegration() {
    clearModalAlert();
    const animals = rowsFor('animais');
    if (!animals.length) { toast('Cadastre um animal antes de solicitar integração.', 'error'); return; }
    $('#modalEyebrow').textContent = 'SERVIÇO EXTERNO';
    $('#modalTitle').textContent = 'Nova solicitação';
    $('#saveButton').textContent = 'Enviar solicitação';
    $('#modalFields').innerHTML = `<div class="field"><label>Animal *</label><select name="animalId" required>${animals.map(a => `<option value="${a.id}">${esc(a.nome)} (#${a.id})</option>`).join('')}</select></div><div class="field"><label>Tipo de operação *</label><select name="tipoOperacao" required><option value="CADASTRO_ANIMAL">Cadastro de animal</option><option value="ATUALIZACAO_ANIMAL">Atualização de animal</option><option value="VACINA_ANTIRRABICA">Vacina antirrábica</option></select></div><div class="field"><label>Vacina antirrábica (quando aplicável)</label><select name="vacinaId"><option value="">Não se aplica</option>${rowsFor('vacinas').filter(v => v.antirrabica).map(v => `<option value="${v.id}">#${v.id} — ${esc(v.nomeVacina)} (${esc(displayName('animais', v.animalId))})</option>`).join('')}</select></div><div class="field"><label>Chave de idempotência</label><input name="chaveIdempotencia" placeholder="Gerada automaticamente se vazio"></div>`;
    state.editing = 'integracao';
    state.editingId = null;
    $('#formDialog').showModal();
}

async function saveSpecial(event) {
    if (state.editing !== 'microchip' && state.editing !== 'integracao') return false;
    event.preventDefault();
    const v = formObject(event.currentTarget);
    try {
        if (state.editing === 'microchip') {
            await api(`/api/animais/${state.editingId}/microchip`, { method: 'POST', body: JSON.stringify({ veterinarioId: Number(v.veterinarioId), codigoMicrochip: v.codigoMicrochip }) });
            toast('Microchip vinculado.');
        } else {
            v.animalId = Number(v.animalId);
            v.vacinaId = v.vacinaId ? Number(v.vacinaId) : null;
            if (!v.chaveIdempotencia || !v.chaveIdempotencia.trim()) {
                v.chaveIdempotencia = `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
            await api(ENDPOINTS.integracoes, { method: 'POST', body: JSON.stringify(v) });
            toast('Solicitação registrada.');
        }
        $('#formDialog').close();
        await load(state.page);
        render();
        return true;
    } catch (e) {
        toast(e.message, 'error');
        return true;
    }
}

$('#entityForm').addEventListener('submit', async e => {
    if (state.editing === 'microchip' || state.editing === 'integracao') { await saveSpecial(e); return; }
    await saveEntity(e);
});
$('#closeModal').onclick = $('#cancelModal').onclick = () => $('#formDialog').close();
$('#closeHistory').onclick = () => $('#historyDialog').close();
$('#navigation').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) navigate(b.dataset.page); });
$('#mobileMenu').onclick = () => $('#sidebar').classList.toggle('open');

async function init() {
    const loggedUser = JSON.parse(localStorage.getItem('vetcare_user') || 'null');
    if (loggedUser) {
        const nome = loggedUser.nomeCompleto || loggedUser.nome || loggedUser.email || 'Veterinário';
        $('#loggedVetName').textContent = nome;
        $('#userAvatar').textContent = nome.slice(0, 2).toUpperCase();
        state.activeVeterinarianId = loggedUser.id ?? null;
    }

    $('#logoutBtn').onclick = () => {
        localStorage.removeItem('vetcare_user');
        window.location.replace('login.html');
    };

    const now = new Date();
    $('#todayLabel').textContent = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    await Promise.all(['animais', 'tutores', 'veterinarios', 'consultas', 'vacinas', 'integracoes', 'especies', 'racas'].map(loadCollection));
    setApiStatus(true);
    try { await api('/api/animais'); setApiStatus(true); } catch { setApiStatus(false); }
    render();
}

window.navigate = navigate;
window.openCreate = openCreate;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.openMicrochip = openMicrochip;
window.showHistory = showHistory;
window.switchRecordTab = switchRecordTab;
window.openIntegration = openIntegration;
window.refreshIntegrations = refreshIntegrations;
init();
