// Estado Global
let isCm = true;
const cargoItems = [];

// Elementos DOM
const unitToggle = document.getElementById('unitToggle');
const lblCm = document.getElementById('lbl-cm');
const lblMm = document.getElementById('lbl-mm');
const unitTexts = document.querySelectorAll('.unit-text');
const cargoList = document.getElementById('cargoList');
const addCargoBtn = document.getElementById('addCargoBtn');
const calculateBtn = document.getElementById('calculateBtn');
const clearBtn = document.getElementById('clearBtn');
const containerSelect = document.getElementById('containerSelect');
const containerPresetsWrapper = document.getElementById('containerPresetsWrapper');
const truckSelect = document.getElementById('truckSelect');
const truckPresetsWrapper = document.getElementById('truckPresetsWrapper');
const customContainerDim = document.getElementById('customContainerDim');
const vehicleOptions = document.querySelectorAll('.vehicle-option');
const vehicleDims = document.querySelectorAll('.vehicle-dim');

// Inputs Container
const contL = document.getElementById('contL');
const contW = document.getElementById('contW');
const contH = document.getElementById('contH');
const contMaxW = document.getElementById('contMaxW');

// Presets de Container (em CM)
const containerPresets = {
    '20ft': { l: 589, w: 235, h: 239, weight: 24000 },
    '40ft': { l: 1203, w: 235, h: 239, weight: 26000 },
    '40hc': { l: 1203, w: 235, h: 269, weight: 28000 }
};

// Presets de Caminhão (em CM, pesos em kg)
const truckPresets = {
    'fiorino': { l: 170, w: 105, h: 105, weight: 500 },
    'van': { l: 340, w: 180, h: 175, weight: 1500 },
    'vuc': { l: 440, w: 205, h: 214, weight: 1800 },
    '3_4_bau': { l: 610, w: 220, h: 224, weight: 3500 },
    'toco_sider': { l: 650, w: 250, h: 290, weight: 6500 },
    'toco_bau': { l: 810, w: 250, h: 260, weight: 6500 },
    'truck_sider': { l: 1030, w: 250, h: 300, weight: 12000 }
};

// Alternância de Unidades
unitToggle.addEventListener('change', (e) => {
    const toMm = e.target.checked;
    if (toMm && isCm) {
        // Mudar para MM
        isCm = false;
        lblCm.classList.remove('active');
        lblMm.classList.add('active');
        document.querySelectorAll('.unit-text').forEach(el => el.textContent = 'mm');
        convertAllValues(10);
    } else if (!toMm && !isCm) {
        // Mudar para CM
        isCm = true;
        lblMm.classList.remove('active');
        lblCm.classList.add('active');
        document.querySelectorAll('.unit-text').forEach(el => el.textContent = 'cm');
        convertAllValues(0.1);
    }
});

function convertAllValues(factor) {
    // Inputs Container (evitar NaN se estiver em branco no modo personalizado)
    if (contL.value) contL.value = Math.round(parseFloat(contL.value) * factor);
    if (contW.value) contW.value = Math.round(parseFloat(contW.value) * factor);
    if (contH.value) contH.value = Math.round(parseFloat(contH.value) * factor);
    
    // Inputs Cargas
    const items = document.querySelectorAll('.cargo-item');
    items.forEach(item => {
        const l = item.querySelector('.cargo-l');
        const w = item.querySelector('.cargo-w');
        const h = item.querySelector('.cargo-h');
        
        if (l.value) l.value = Math.round(parseFloat(l.value || 0) * factor);
        if (w.value) w.value = Math.round(parseFloat(w.value || 0) * factor);
        if (h.value) h.value = Math.round(parseFloat(h.value || 0) * factor);
    });
}

// Lógica do Vehicle Selector (Container vs Caminhão)
let activeVehicleType = 'truck';

vehicleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        vehicleOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        activeVehicleType = opt.dataset.type;
        
        if (activeVehicleType === 'container') {
            containerPresetsWrapper.style.display = 'block';
            truckPresetsWrapper.style.display = 'none';
            containerSelect.dispatchEvent(new Event('change'));
        } else {
            containerPresetsWrapper.style.display = 'none';
            truckPresetsWrapper.style.display = 'block';
            
            // Garantir que a lógica de leitura/edição seja aplicada
            truckSelect.dispatchEvent(new Event('change'));
        }
        liveUpdate();
    });
});

// Seleção de Preset de Container
containerSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
        contL.value = '';
        contW.value = '';
        contH.value = '';
        contMaxW.value = '';
    } else {
        const preset = containerPresets[val];
        if(preset) {
            const multiplier = isCm ? 1 : 10;
            contL.value = Math.round(preset.l * multiplier);
            contW.value = Math.round(preset.w * multiplier);
            contH.value = Math.round(preset.h * multiplier);
            contMaxW.value = preset.weight;
        }
    }
    liveUpdate();
});

// Seleção de Preset de Caminhão
truckSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
        contL.value = '';
        contW.value = '';
        contH.value = '';
        contMaxW.value = '';
    } else {
        const preset = truckPresets[val];
        if (preset) {
            const multiplier = isCm ? 1 : 10;
            contL.value = Math.round(preset.l * multiplier);
            contW.value = Math.round(preset.w * multiplier);
            contH.value = Math.round(preset.h * multiplier);
            contMaxW.value = preset.weight;
        }
    }
    liveUpdate();
});

// Atualização Reativa nas Mudanças Manuais
vehicleDims.forEach(input => {
    input.addEventListener('input', () => {
        // Se o usuário editar diretamente as dimensões, muda o select correspondente para personalizado
        if (activeVehicleType === 'truck') {
            if (truckSelect.value !== 'custom') {
                truckSelect.value = 'custom';
            }
        } else {
            if (containerSelect.value !== 'custom') {
                containerSelect.value = 'custom';
            }
        }
        liveUpdate();
    });
});

function liveUpdate() {
    clearTimeout(liveUpdate.timeout);
    liveUpdate.timeout = setTimeout(() => {
        try { runPacking(); } catch(e) { console.error(e); }
    }, 300); // debounce pequeno
}

// Inicializar veiculo inicial
const activeOpt = document.querySelector('.vehicle-option.active');
if (activeOpt) {
    activeOpt.dispatchEvent(new Event('click'));
} else {
    containerSelect.dispatchEvent(new Event('change'));
}

// Botão Limpar Tudo
clearBtn.addEventListener('click', () => {
    // 1. Limpar cargas
    cargoList.innerHTML = '';
    addCargoBtn.click(); // Adiciona um item padrão
    
    // 2. Limpar veículo (se for caminhão, colocar personalizado e em branco)
    if (activeVehicleType === 'truck') {
        truckSelect.value = 'custom';
        truckSelect.dispatchEvent(new Event('change'));
    } else {
        containerSelect.value = '20ft';
        containerSelect.dispatchEvent(new Event('change'));
    }
    
    // 3. Resetar visualizador 3D
    if (containerMesh) scene.remove(containerMesh);
    boxesMeshes.forEach(mesh => scene.remove(mesh));
    boxesMeshes = [];
    containerMesh = null;
    
    // Mostrar empty state
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = 'block';
    
    // Remover canvas antigo se houver
    const canvas = document.querySelector('#canvas-container canvas');
    if (canvas) canvas.remove();
    renderer = null;
    scene = null;
    camera = null;
    controls = null;
    
    // 4. Limpar avisos de capacidade
    const warningBox = document.getElementById('capacity-warning');
    if (warningBox) warningBox.style.display = 'none';
    const warningList = document.getElementById('warning-items-list');
    if (warningList) warningList.innerHTML = '';
    const warningNotice = document.getElementById('warning-notice');
    if (warningNotice) warningNotice.style.display = 'none';
    const statBoxWeight = document.getElementById('stat-box-weight');
    if (statBoxWeight) statBoxWeight.classList.remove('weight-warning');
    
    // 5. Resetar estatísticas
    document.getElementById('stat-count').textContent = '0 / 0';
    document.getElementById('stat-vol').textContent = '0.00%';
    document.getElementById('stat-weight').textContent = '0 kg / 0 kg (0.00%)';
});

// Função auxiliar para adicionar item de carga com valores predefinidos
function addCargoItem(name, w, h, d, q, weight, rotate, stackable, color) {
    const template = document.getElementById('cargo-template');
    const clo = template.content.cloneNode(true);
    const cargoItemDiv = clo.querySelector('.cargo-item');
    
    // Botão de remover
    clo.querySelector('.btn-remove').addEventListener('click', () => {
        cargoItemDiv.remove();
        liveUpdate();
    });
    
    // Preencher valores
    clo.querySelector('.cargo-name').value = name;
    clo.querySelector('.cargo-w').value = w;
    clo.querySelector('.cargo-h').value = h;
    clo.querySelector('.cargo-l').value = d;
    clo.querySelector('.cargo-q').value = q;
    clo.querySelector('.cargo-weight-val').value = weight;
    clo.querySelector('.cargo-rotate').checked = rotate;
    clo.querySelector('.cargo-stackable').checked = stackable;
    clo.querySelector('.cargo-color').value = color;

    // Vincular atualizações em tempo real a todos os campos deste item
    const inputs = cargoItemDiv.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => liveUpdate());
        input.addEventListener('change', () => liveUpdate());
    });

    cargoList.appendChild(clo);
}

// Adição de Carga Manual via Botão
addCargoBtn.addEventListener('click', () => {
    // Paleta de cores para daltônicos (Okabe-Ito / Tol) - Alta distinção visual e contraste
    const colorblindPalette = [
        '#E69F00', // Laranja
        '#56B4E9', // Azul Céu
        '#009E73', // Verde Azulado
        '#F0E442', // Amarelo
        '#0072B2', // Azul Escuro
        '#D55E00', // Vermelho Alaranjado
        '#CC79A7', // Violeta Avermelhado
        '#00E5FF', // Ciano Vibrante
        '#FF5722', // Laranja Avermelhado
        '#AEEA00', // Lima
        '#B388FF'  // Violeta
    ];
    
    // Buscar cores atualmente em uso na lista
    const usedColors = Array.from(cargoList.querySelectorAll('.cargo-color')).map(el => el.value.toUpperCase());
    
    // Encontrar a primeira cor da paleta que não está sendo usada
    let chosenColor = colorblindPalette.find(c => !usedColors.includes(c.toUpperCase()));
    
    // Se todas já estiverem em uso, rotacionar com base no número de itens
    if (!chosenColor) {
        const currentCount = cargoList.querySelectorAll('.cargo-item').length;
        chosenColor = colorblindPalette[currentCount % colorblindPalette.length];
    }
    
    addCargoItem('', 100, 100, 100, 10, 50, true, true, chosenColor);
    liveUpdate();
});

// Inicializar com exemplo pré-preenchido de otimização de estufagem
function initializeExample() {
    // 1. Selecionar veículo VUC
    truckSelect.value = 'vuc';
    truckSelect.dispatchEvent(new Event('change'));
    
    // 2. Limpar qualquer carga inicial
    cargoList.innerHTML = '';
    
    // 3. Adicionar cargas do exemplo que demonstram a otimização
    addCargoItem('Palete Grande', 120, 100, 150, 4, 200, true, true, '#E69F00');
    addCargoItem('Caixa Média', 80, 60, 50, 12, 45, true, true, '#56B4E9');
    addCargoItem('Caixa Pequena', 40, 40, 40, 20, 15, true, true, '#009E73');
    
    // 4. Rodar o cálculo após o layout inicial do navegador
    liveUpdate();
}

// Iniciar a aplicação com o exemplo preenchido
initializeExample();

// ----------------------------------------------------
// LÓGICA DE BIN PACKING E THREE.JS
// ----------------------------------------------------

let scene, camera, renderer, controls;
let containerMesh = null;
let boxesMeshes = [];

function init3D() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    
    // Câmera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 10000);
    camera.position.set(2000, 2000, 2000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Limpar estado inicial
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = 'none';
    
    container.appendChild(renderer.domElement);
    
    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1000, 2000, 1000);
    scene.add(dirLight);

    // Controles
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Eixos para referência (removidos)
    // const axesHelper = new THREE.AxesHelper(1000);
    // scene.add(axesHelper);
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if(controls) controls.update();
    if(renderer && scene && camera) renderer.render(scene, camera);
}

// Quando a janela for redimensionada
window.addEventListener('resize', () => {
    const container = document.getElementById('canvas-container');
    if(camera && renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});

calculateBtn.addEventListener('click', () => {
    document.getElementById('loading-overlay').classList.remove('hidden');
    
    setTimeout(() => {
        try {
            runPacking(true);
        } catch(e) {
            console.error(e);
            alert("Erro ao calcular: " + e.message);
        }
        document.getElementById('loading-overlay').classList.add('hidden');
    }, 100);
});

function getVal(val) {
    const v = parseFloat(val);
    return isNaN(v) ? 0 : v;
}

// Algoritmo Guildotine 3D Heurístico Simplificado
class Space {
    constructor(x, y, z, w, h, d) {
        this.x = x; this.y = y; this.z = z;
        this.w = w; this.h = h; this.d = d;
    }
}

function singlePacking(items, cW, cH, cD, maxWeight, sortFunc, splitAxis = 0) {
    // Fazer cópia profunda para não contaminar outras execuções
    let localItems = items.map(x => ({ ...x }));
    
    // Ordenar conforme estratégia
    localItems.sort(sortFunc);
    
    let freeSpaces = [new Space(0, 0, 0, cW, cH, cD)];
    let packedItems = [];
    let currentWeight = 0;
    let failedItems = [];
    
    for(const item of localItems) {
        if(currentWeight + item.weight > maxWeight) {
            failedItems.push({ name: item.name, color: item.color, reason: 'weight' });
            continue; 
        }

        // Tentar encontrar um espaço
        let bestSpaceIndex = -1;
        let finalW, finalH, finalD;
        
        // Rotações permitidas (apenas no plano Y - comprimento x largura)
        let rotations = [ [item.w, item.h, item.d] ];
        if(item.rotate) {
            rotations.push([item.d, item.h, item.w]);
        }

        for(let i = 0; i < freeSpaces.length; i++) {
            let space = freeSpaces[i];
            
            for(let rot of rotations) {
                let [rw, rh, rd] = rot;
                if(rw <= space.w && rh <= space.h && rd <= space.d) {
                    if(bestSpaceIndex === -1) {
                        bestSpaceIndex = i;
                        finalW = rw; finalH = rh; finalD = rd;
                    } else {
                        let bestSpace = freeSpaces[bestSpaceIndex];
                        if(space.y < bestSpace.y || (space.y === bestSpace.y && space.z < bestSpace.z)) {
                            bestSpaceIndex = i;
                            finalW = rw; finalH = rh; finalD = rd;
                        }
                    }
                }
            }
        }

        if(bestSpaceIndex !== -1) {
            let space = freeSpaces.splice(bestSpaceIndex, 1)[0];
            
            // Empacotar
            packedItems.push({
                ...item,
                x: space.x,
                y: space.y,
                z: space.z,
                w: finalW,
                h: finalH,
                d: finalD
            });
            currentWeight += item.weight;

            // Dividir espaço restante com base no eixo escolhido
            // 1. Espaço Acima (Top) - Apenas se o item for empilhável!
            if(item.stackable && space.h - finalH > 0) {
                freeSpaces.push(new Space(space.x, space.y + finalH, space.z, finalW, space.h - finalH, finalD));
            }
            
            if (splitAxis === 0) {
                // Divisão A: Otimizar largura (lado a lado primeiro)
                if(space.w - finalW > 0) {
                    freeSpaces.push(new Space(space.x + finalW, space.y, space.z, space.w - finalW, space.h, space.d));
                }
                if(space.d - finalD > 0) {
                    freeSpaces.push(new Space(space.x, space.y, space.z + finalD, finalW, space.h, space.d - finalD));
                }
            } else {
                // Divisão B: Otimizar profundidade (frente/fundo primeiro)
                if(space.w - finalW > 0) {
                    freeSpaces.push(new Space(space.x + finalW, space.y, space.z, space.w - finalW, space.h, finalD));
                }
                if(space.d - finalD > 0) {
                    freeSpaces.push(new Space(space.x, space.y, space.z + finalD, space.w, space.h, space.d - finalD));
                }
            }
        } else {
            failedItems.push({ name: item.name, color: item.color, reason: 'space' });
        }
    }

    let totalPackedVolume = 0;
    packedItems.forEach(i => totalPackedVolume += (i.w * i.h * i.d));

    return {
        packedItems,
        failedItems,
        currentWeight,
        packedVolume: totalPackedVolume,
        packedCount: packedItems.length
    };
}

function runPacking(showAlerts = false) {
    // 1. Coletar dados do Veículo (Converter para CM para o cálculo interno, facilita)
    const factorToCm = isCm ? 1 : 0.1;
    const cW = getVal(contW.value) * factorToCm;
    const cH = getVal(contH.value) * factorToCm;
    const cD = getVal(contL.value) * factorToCm; // L = depth
    const maxWeight = getVal(contMaxW.value);
    
    if(cW === 0 || cH === 0 || cD === 0) {
        if (showAlerts) alert("Dimensões do veículo inválidas.");
        return;
    }

    // 2. Coletar Cargas
    let itemsToPack = [];
    let boxesCount = 0;
    
    const cargoDOMs = document.querySelectorAll('.cargo-item');
    cargoDOMs.forEach(node => {
        const name = node.querySelector('.cargo-name').value || "Carga";
        const w = getVal(node.querySelector('.cargo-w').value) * factorToCm;
        const h = getVal(node.querySelector('.cargo-h').value) * factorToCm;
        const d = getVal(node.querySelector('.cargo-l').value) * factorToCm;
        const q = parseInt(node.querySelector('.cargo-q').value) || 0;
        const weight = getVal(node.querySelector('.cargo-weight-val').value);
        const rotate = node.querySelector('.cargo-rotate').checked;
        const stackable = node.querySelector('.cargo-stackable').checked;
        const color = node.querySelector('.cargo-color').value;
        
        boxesCount += q;
        
        for(let i=0; i<q; i++) {
            itemsToPack.push({
                id: Math.random().toString(),
                name, w, h, d, weight, rotate, stackable, color, volume: w*h*d
            });
        }
    });
    
    if(itemsToPack.length === 0) {
        if (showAlerts) alert("Adicione pelo menos uma carga.");
        return;
    }

    // Estratégias de Ordenação para Otimização (8 estratégias)
    const sortingStrategies = [
        { name: 'Ordem de Entrada', sort: () => 0 },
        { name: 'Volume Desc', sort: (a,b) => b.volume - a.volume },
        { name: 'Altura Desc', sort: (a,b) => b.h - a.h },
        { name: 'Área Base Desc', sort: (a,b) => (b.w * b.d) - (a.w * a.d) },
        { name: 'Maior Lado Desc', sort: (a,b) => Math.max(b.w, b.h, b.d) - Math.max(a.w, a.h, a.d) },
        { name: 'Comprimento Desc', sort: (a,b) => b.d - a.d },
        { name: 'Largura Desc', sort: (a,b) => b.w - a.w },
        { name: 'Volume Asc', sort: (a,b) => a.volume - b.volume }
    ];

    let bestResult = null;
    let bestStrategyName = '';

    // Testar as 8 estratégias com os 2 métodos de divisão de espaço (total de 16 combinações!)
    for (const strategy of sortingStrategies) {
        for (let splitAxis of [0, 1]) {
            const result = singlePacking(itemsToPack, cW, cH, cD, maxWeight, strategy.sort, splitAxis);
            if (!bestResult) {
                bestResult = result;
                bestStrategyName = `${strategy.name} (Split ${splitAxis})`;
            } else {
                // Escolhe a estratégia que ocupar MAIOR volume (melhor aproveitamento de espaço do veículo)
                if (result.packedVolume > bestResult.packedVolume) {
                    bestResult = result;
                    bestStrategyName = `${strategy.name} (Split ${splitAxis})`;
                }
                // Em caso de empate no volume ocupado, escolhe a que colocar MAIS caixas (maior quantidade de itens)
                else if (result.packedVolume === bestResult.packedVolume && result.packedCount > bestResult.packedCount) {
                    bestResult = result;
                    bestStrategyName = `${strategy.name} (Split ${splitAxis})`;
                }
            }
        }
    }

    const { packedItems, failedItems, currentWeight } = bestResult;

    render3D(cW, cH, cD, packedItems);
    updateStats(boxesCount, packedItems.length, cW*cH*cD, packedItems, currentWeight, maxWeight);
    
    // Banner de Aviso: Por que não coube ou se o peso está saturado
    const warningBox = document.getElementById('capacity-warning');
    const warningList = document.getElementById('warning-items-list');
    const warningHeader = warningBox.querySelector('.warning-header');
    const warningContent = warningBox.querySelector('.warning-content');
    const warningNotice = document.getElementById('warning-notice');
    const statBoxWeight = document.getElementById('stat-box-weight');
    
    const isWeightSaturated = maxWeight > 0 && currentWeight >= maxWeight;
    const weightBlocked = failedItems.some(f => f.reason === 'weight') || isWeightSaturated;
    
    if (failedItems.length > 0 || isWeightSaturated) {
        warningBox.style.display = 'block';
        
        if (failedItems.length > 0) {
            if (warningHeader) warningHeader.style.display = 'flex';
            if (warningContent) warningContent.style.display = 'block';
            warningList.innerHTML = '';
            
            // Agrupar falhas por nome do item, cor e motivo
            const summaryMap = {};
            for (const f of failedItems) {
                const key = `${f.name}|${f.color}|${f.reason}`;
                if (!summaryMap[key]) {
                    summaryMap[key] = { name: f.name, color: f.color, reason: f.reason, count: 0 };
                }
                summaryMap[key].count++;
            }
            
            Object.values(summaryMap).forEach(f => {
                const tr = document.createElement('tr');
                
                // Coluna Cor
                const tdColor = document.createElement('td');
                const colorDot = document.createElement('span');
                colorDot.className = 'warning-color-dot';
                colorDot.style.backgroundColor = f.color;
                tdColor.appendChild(colorDot);
                
                // Coluna Item
                const tdName = document.createElement('td');
                tdName.textContent = f.name;
                tdName.style.fontWeight = '500';
                
                // Coluna Qtd
                const tdCount = document.createElement('td');
                tdCount.textContent = f.count;
                tdCount.style.textAlign = 'center';
                tdCount.style.fontWeight = '600';
                
                // Coluna Motivo
                const tdReason = document.createElement('td');
                tdReason.style.textAlign = 'right';
                const reasonSpan = document.createElement('span');
                reasonSpan.className = `warning-reason ${f.reason}`;
                reasonSpan.textContent = f.reason === 'weight' ? 'Excesso Peso' : 'Falta Espaço';
                tdReason.appendChild(reasonSpan);
                
                tr.appendChild(tdColor);
                tr.appendChild(tdName);
                tr.appendChild(tdCount);
                tr.appendChild(tdReason);
                
                warningList.appendChild(tr);
            });
        } else {
            // Se tudo coube mas o peso está saturado, esconde cabeçalho e tabela de itens que não couberam
            if (warningHeader) warningHeader.style.display = 'none';
            if (warningContent) warningContent.style.display = 'none';
            warningList.innerHTML = '';
        }
    } else {
        warningBox.style.display = 'none';
        warningList.innerHTML = '';
    }

    // Alertas específicos de peso saturado
    if (weightBlocked) {
        if (statBoxWeight) statBoxWeight.classList.add('weight-warning');
        
        let percentageText = ((currentWeight / maxWeight) * 100).toFixed(2) + '%';
        const currentWStr = Math.round(currentWeight).toLocaleString('pt-BR');
        const maxWStr = Math.round(maxWeight).toLocaleString('pt-BR');
        
        if (isWeightSaturated) {
            document.getElementById('stat-weight').textContent = `${currentWStr} kg / ${maxWStr} kg (${percentageText} - Ocupação Total)`;
            if (warningNotice) {
                warningNotice.style.display = 'flex';
                warningNotice.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Ocupação total de peso (${currentWStr} kg de ${maxWStr} kg)!`;
            }
        } else {
            document.getElementById('stat-weight').textContent = `${currentWStr} kg / ${maxWStr} kg (${percentageText} - Saturado)`;
            if (warningNotice) {
                warningNotice.style.display = 'flex';
                warningNotice.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Limite de peso atingido (${currentWStr} kg de ${maxWStr} kg)!`;
            }
        }
    } else {
        if (statBoxWeight) statBoxWeight.classList.remove('weight-warning');
        if (warningNotice) warningNotice.style.display = 'none';
    }
}

function updateStats(totalBoxes, packedBoxes, totalVol, packedItems, currentWeight, maxWeight) {
    document.getElementById('stat-count').textContent = `${packedBoxes} / ${totalBoxes}`;
    
    let usedVol = 0;
    packedItems.forEach(i => usedVol += (i.w * i.h * i.d));
    let volPercent = totalVol > 0 ? (usedVol / totalVol) * 100 : 0;
    document.getElementById('stat-vol').textContent = volPercent.toFixed(2) + '%';
    
    let wPercent = maxWeight > 0 ? (currentWeight / maxWeight) * 100 : 0;
    const currentWStr = Math.round(currentWeight).toLocaleString('pt-BR');
    const maxWStr = Math.round(maxWeight).toLocaleString('pt-BR');
    document.getElementById('stat-weight').textContent = `${currentWStr} kg / ${maxWStr} kg (${wPercent.toFixed(2)}%)`;
}

function render3D(cW, cH, cD, packedItems) {
    if(!scene) init3D();
    
    // Limpar meshes antigas
    if(containerMesh) scene.remove(containerMesh);
    boxesMeshes.forEach(mesh => scene.remove(mesh));
    boxesMeshes = [];

    // O Three.js posiciona pelo centro. Para alinhar como a nossa lógia (x,y,z da ponta), vamos criar um Offset.
    const ox = -cW/2;
    const oy = -cH/2;
    const oz = -cD/2;

    // Criar Container Wrapper
    const contGeo = new THREE.BoxGeometry(cW, cH, cD);
    const contMat = new THREE.MeshBasicMaterial({ 
        color: 0x3B82F6, 
        wireframe: false, 
        transparent: true, 
        opacity: 0.1,
        depthWrite: false
    });
    containerMesh = new THREE.Mesh(contGeo, contMat);
    // Adicionar bordas marcadas
    const edges = new THREE.EdgesGeometry(contGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x3B82F6, linewidth: 2 }));
    containerMesh.add(line);
    
    // Centralizar
    containerMesh.position.set(0, 0, 0);
    scene.add(containerMesh);

    // Adicionar Caixas
    packedItems.forEach(item => {
        const geo = new THREE.BoxGeometry(item.w, item.h, item.d);
        
        // Criar bordas finas para distinguir caixas da mesma cor
        const bEdges = new THREE.EdgesGeometry(geo);
        const bLine = new THREE.LineSegments(bEdges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1, transparent: true, opacity: 0.5 }));

        const mat = new THREE.MeshLambertMaterial({ color: item.color });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Offset baseado no (x,y,z) que é bottom-left-back no nosso box algorithm
        mesh.position.set(
            ox + item.x + item.w/2,
            oy + item.y + item.h/2,
            oz + item.z + item.d/2
        );
        
        mesh.add(bLine);
        scene.add(mesh);
        boxesMeshes.push(mesh);
    });

    // Ajustar Câmera
    const maxDim = Math.max(cW, cH, cD);
    camera.position.set(maxDim*1.2, maxDim*0.8, maxDim*1.2);
    controls.target.set(0, 0, 0);
}

