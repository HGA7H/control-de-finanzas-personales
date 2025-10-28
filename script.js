document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO Y DATOS --- //
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let activePage = 'agregar';
    
    const defaultCategorias = {
        gasto: ['Comida', 'Salud', 'Transporte', 'Vivienda', 'Entretenimiento', 'Trabajo', 'Otros'],
        ingreso: ['Salario', 'Bonificación', 'Ventas', 'Inversiones', 'Regalo', 'Otros']
    };
    let categorias = JSON.parse(localStorage.getItem('categorias')) || defaultCategorias;
    
    let currentTheme = localStorage.getItem('theme') || 'light';

    let chartGastos = null;
    let chartIngresos = null;
    
    // REQ 2: Variable para el evento de instalación
    let deferredInstallPrompt = null;

    // --- SELECTORES DEL DOM --- //
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const appTitle = document.getElementById('app-title');
    
    // --- Pantalla Agregar ---
    const formAgregar = document.getElementById('form-agregar');
    const tipoRadios = document.getElementsByName('tipo');
    const selectCategoria = document.getElementById('categoria');
    const inputMonto = document.getElementById('monto');
    const inputFecha = document.getElementById('fecha');
    const inputDescripcion = document.getElementById('descripcion');

    // --- Pantalla Registros ---
    const listaRegistros = document.getElementById('lista-registros');
    const filterFechaTipo = document.getElementById('filter-fecha-tipo');
    const filterDateSpecifics = document.querySelectorAll('#page-registros .filter-date-specific');
    const filterFechaDiaInput = document.getElementById('filter-fecha-dia-input');
    const filterFechaMesInput = document.getElementById('filter-fecha-mes-input');
    const filterFechaAnioInput = document.getElementById('filter-fecha-anio-input');
    const filterTipoRegistros = document.getElementById('filter-tipo-registros');
    const filterSortRegistros = document.getElementById('filter-sort-registros');
    const btnAplicarFiltrosRegistros = document.getElementById('btn-aplicar-filtros-registros');
    // REQ 1: Botón Exportar
    const btnExportExcel = document.getElementById('btn-export-excel');
    
    // --- Pantalla Resumen ---
    const ctxGastos = document.getElementById('chart-gastos')?.getContext('2d');
    const ctxIngresos = document.getElementById('chart-ingresos')?.getContext('2d');
    const filterTipoResumen = document.getElementById('filter-tipo-resumen');
    const totalIngresosEl = document.getElementById('total-ingresos');
    const totalGastosEl = document.getElementById('total-gastos');
    const balanceNetoEl = document.getElementById('balance-neto');
    const filterFechaTipoResumen = document.getElementById('filter-fecha-tipo-resumen');
    const filterDateSpecificsResumen = document.querySelectorAll('#page-resumen .filter-date-specific');
    const filterFechaDiaInputResumen = document.getElementById('filter-fecha-dia-input-resumen');
    const filterFechaMesInputResumen = document.getElementById('filter-fecha-mes-input-resumen');
    const filterFechaAnioInputResumen = document.getElementById('filter-fecha-anio-input-resumen');
    const btnAplicarFiltrosResumen = document.getElementById('btn-aplicar-filtros-resumen');

    // --- Pantalla Configuración ---
    const themeToggle = document.getElementById('theme-toggle');
    const formAgregarCategoria = document.getElementById('form-agregar-categoria');
    const inputNuevaCategoria = document.getElementById('input-nueva-categoria');
    const selectTipoCategoria = document.getElementById('select-tipo-categoria');
    const listaCatGasto = document.getElementById('lista-cat-gasto');
    const listaCatIngreso = document.getElementById('lista-cat-ingreso');
    // REQ 2: Botón de Instalación
    const btnInstallPWA = document.getElementById('btn-install-pwa');
    const installMessage = document.getElementById('install-message');

    // --- Modal ---
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');

    // --- INICIALIZACIÓN --- //

    // REQ 2: Escuchar el evento 'beforeinstallprompt'
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir que el navegador muestre su propio prompt
        e.preventDefault();
        // Guardar el evento para usarlo después
        deferredInstallPrompt = e;
        // Mostrar nuestro botón de instalación personalizado
        btnInstallPWA.classList.remove('hidden');
        installMessage.textContent = '¡La aplicación está lista para instalar!';
    });

    // REQ 2: Escuchar si la app ya fue instalada
    window.addEventListener('appinstalled', () => {
        // Ocultar el botón y limpiar el prompt
        btnInstallPWA.classList.add('hidden');
        deferredInstallPrompt = null;
        installMessage.textContent = '¡La aplicación ha sido instalada con éxito!';
    });

    function init() {
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => console.log('ServiceWorker registrado con éxito:', registration.scope))
                    .catch(error => console.log('Error al registrar ServiceWorker:', error));
            });
        }

        // Navegación
        navButtons.forEach(button => {
            button.addEventListener('click', () => navigateTo(button.dataset.page));
        });

        // --- Event Listeners ---
        
        // Modal
        modalClose.addEventListener('click', hideModal);
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) hideModal();
        });

        // Agregar
        tipoRadios.forEach(radio => radio.addEventListener('change', updateCategoriasDropdown));
        formAgregar.addEventListener('submit', agregarTransaccion);
        
        // Registros
        filterFechaTipo.addEventListener('change', () => toggleDateFilters('registros'));
        btnAplicarFiltrosRegistros.addEventListener('click', updateUI);
        filterTipoRegistros.addEventListener('change', updateUI);
        filterSortRegistros.addEventListener('change', updateUI); 
        listaRegistros.addEventListener('click', handleRegistrosClick);
        // REQ 1: Listener Exportar Excel
        btnExportExcel.addEventListener('click', exportToExcel);

        // Resumen
        filterFechaTipoResumen.addEventListener('change', () => toggleDateFilters('resumen'));
        btnAplicarFiltrosResumen.addEventListener('click', updateUI);
        filterTipoResumen.addEventListener('change', updateUI);

        // Configuración
        themeToggle.addEventListener('change', toggleTheme);
        formAgregarCategoria.addEventListener('submit', agregarCategoria);
        listaCatGasto.addEventListener('click', handleCategoriaClick);
        listaCatIngreso.addEventListener('click', handleCategoriaClick);
        // REQ 2: Listener Botón Instalar
        btnInstallPWA.addEventListener('click', installPWA);
        
        // --- Carga inicial ---
        applyTheme(currentTheme);
        setDefaultDate();
        updateCategoriasDropdown();
        renderCategoriasConfig();
        navigateTo(activePage);
    }

    // --- NAVEGACIÓN --- //
    function navigateTo(pageId) {
        activePage = pageId;
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page-${pageId}`)?.classList.add('active');
        navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageId));

        const titles = {
            agregar: 'Agregar Movimiento',
            resumen: 'Resumen de Movimientos',
            registros: 'Historial de Registros',
            configuracion: 'Configuración'
        };
        appTitle.textContent = titles[pageId] || 'Control de Gastos';

        updateUI();
    }

    // --- LÓGICA DE "AGREGAR" --- //
    function setDefaultDate() {
        if (!inputFecha) return;
        inputFecha.value = new Date().toISOString().split('T')[0];
    }

    function updateCategoriasDropdown() {
        if (!selectCategoria) return; // Asegurarse de que el elemento exista
        const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked').value;
        const cats = categorias[tipoSeleccionado] || [];
        
        selectCategoria.innerHTML = '';
        cats.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectCategoria.appendChild(option);
        });
    }

    function agregarTransaccion(e) {
        e.preventDefault();
        
        if (!selectCategoria.value) {
            showCustomAlert('Error', 'No hay categoría seleccionada. Ve a Configuración para agregar una.');
            return;
        }

        const transaccion = {
            id: Date.now(),
            tipo: document.querySelector('input[name="tipo"]:checked').value,
            categoria: selectCategoria.value,
            monto: parseFloat(inputMonto.value),
            fecha: inputFecha.value,
            descripcion: inputDescripcion.value || 'Sin descripción'
        };

        transactions.push(transaccion);
        saveTransactions();
        
        formAgregar.reset();
        setDefaultDate();
        document.getElementById('tipo-gasto').checked = true;
        updateCategoriasDropdown();
        
        showCustomAlert('Éxito', 'Movimiento guardado correctamente.');
    }
    
    // --- LÓGICA DE EDICIÓN Y ELIMINACIÓN --- //
    
    function handleRegistrosClick(e) {
        const editButton = e.target.closest('.btn-edit-registro');
        if (editButton) {
            const id = parseInt(editButton.dataset.id);
            startEditTransaccion(id);
        }
    }

    function startEditTransaccion(id) {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        const cats = categorias[tx.tipo] || [];
        const categoriaOptions = cats.map(cat => 
            `<option value="${cat}" ${cat === tx.categoria ? 'selected' : ''}>${cat}</option>`
        ).join('');

        const formHtml = `
            <form id="form-edit" data-id="${id}">
                <div class="form-group">
                    <label>Tipo</label>
                    <input type="text" value="${tx.tipo === 'gasto' ? 'Gasto' : 'Ingreso'}" disabled style="background-color: var(--disabled-color); color: var(--text-dark);">
                </div>
                <div class="form-group">
                    <label for="edit-categoria">Categoría</label>
                    <select id="edit-categoria" required>
                        ${categoriaOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-monto">Monto (USD)</label>
                    <input type="number" id="edit-monto" value="${tx.monto}" min="0.01" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="edit-fecha">Fecha</label>
                    <input type="date" id="edit-fecha" value="${tx.fecha}" required>
                </div>
                <div class="form-group">
                    <label for="edit-descripcion">Descripción</label>
                    <textarea id="edit-descripcion" rows="3">${tx.descripcion}</textarea>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 1rem; margin-top: 1.5rem;">
                    <button type="button" id="btn-delete-tx" class="btn-submit" style="background: var(--gasto-color); flex-grow: 1;">Eliminar</button>
                    <button type="submit" class="btn-submit" style="flex-grow: 2;">Guardar Cambios</button>
                </div>
            </form>
        `;
        
        showModal('Editar Movimiento', formHtml);

        document.getElementById('form-edit').addEventListener('submit', saveEditTransaccion);
        document.getElementById('btn-delete-tx').addEventListener('click', () => {
             hideModal();
             showConfirmation('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar este registro permanentemente?', () => deleteTransaccion(id));
        });
    }

    function saveEditTransaccion(e) {
        e.preventDefault();
        const id = parseInt(e.target.dataset.id);
        const index = transactions.findIndex(t => t.id === id);
        if (index === -1) return;

        transactions[index] = {
            ...transactions[index],
            categoria: document.getElementById('edit-categoria').value,
            monto: parseFloat(document.getElementById('edit-monto').value),
            fecha: document.getElementById('edit-fecha').value,
            descripcion: document.getElementById('edit-descripcion').value || 'Sin descripción'
        };

        saveTransactions();
        hideModal();
        updateUI();
        showCustomAlert('Éxito', 'Movimiento actualizado.');
    }
    
    function deleteTransaccion(id) {
        transactions = transactions.filter(tx => tx.id !== id);
        saveTransactions();
        updateUI();
        showCustomAlert('Éxito', 'Movimiento eliminado.');
    }


    // --- LÓGICA DE DATOS (localStorage) --- //
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    function saveCategorias() {
        localStorage.setItem('categorias', JSON.stringify(categorias));
        updateCategoriasDropdown();
        updateUI();
    }

    // --- LÓGICA DE FILTROS Y UI (Registros y Resumen) --- //
    
    function updateUI() {
        // Solo actualiza la página activa
        if (activePage === 'agregar') {
            // La página de agregar no necesita 'updateUI' general
            return;
        }

        const filteredTransactions = getFilteredTransactions();
        
        if (activePage === 'registros') {
            renderRegistros(filteredTransactions);
        }
        
        if (activePage === 'resumen') {
            renderBalance(filteredTransactions);
            renderCharts(filteredTransactions);
        }
        
        if (activePage === 'configuracion') {
            renderCategoriasConfig();
        }
    }

    function getFilteredTransactions() {
        let filtered = [...transactions];
        let filterTipo, tipoFecha, dia, mes, anio, sortOrder;

        if (activePage === 'registros') {
            filterTipo = filterTipoRegistros.value;
            tipoFecha = filterFechaTipo.value;
            dia = filterFechaDiaInput.value;
            mes = filterFechaMesInput.value;
            anio = filterFechaAnioInput.value;
            sortOrder = filterSortRegistros.value;

        } else if (activePage === 'resumen') {
            filterTipo = filterTipoResumen.value;
            tipoFecha = filterFechaTipoResumen.value;
            dia = filterFechaDiaInputResumen.value;
            mes = filterFechaMesInputResumen.value;
            anio = filterFechaAnioInputResumen.value;
            sortOrder = 'newest';
        } else {
            return [...transactions]; // Devuelve todo si no es una página de filtro
        }

        // 1. Filtro por Tipo
        if (filterTipo && filterTipo !== 'todos') {
            filtered = filtered.filter(tx => tx.tipo === filterTipo);
        }
        
        // 2. Filtros de Fecha
        switch (tipoFecha) {
            case 'diario':
                if (dia) filtered = filtered.filter(tx => tx.fecha === dia);
                break;
            case 'mensual':
                if (mes) filtered = filtered.filter(tx => tx.fecha.startsWith(mes));
                break;
            case 'anual':
                if (anio) filtered = filtered.filter(tx => tx.fecha.startsWith(anio));
                break;
            case 'general':
            default:
                break;
        }

        // 3. Orden (Solo para registros)
        filtered.sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            if (activePage === 'registros') {
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            }
            return dateB - dateA;
        });
        
        return filtered;
    }

    function toggleDateFilters(pagePrefix) {
        let tipoSeleccionado, specifics, diaEl, mesEl, anioEl;
        
        if (pagePrefix === 'registros') {
            tipoSeleccionado = filterFechaTipo.value;
            specifics = filterDateSpecifics;
            diaEl = 'filter-fecha-diario';
            mesEl = 'filter-fecha-mensual';
            anioEl = 'filter-fecha-anual';
        } else {
            tipoSeleccionado = filterFechaTipoResumen.value;
            specifics = filterDateSpecificsResumen;
            diaEl = 'filter-fecha-diario-resumen';
            mesEl = 'filter-fecha-mensual-resumen';
            anioEl = 'filter-fecha-anual-resumen';
        }
        
        specifics.forEach(el => el.classList.add('hidden'));
        
        if (tipoSeleccionado === 'diario') {
            document.getElementById(diaEl).classList.remove('hidden');
        } else if (tipoSeleccionado === 'mensual') {
            document.getElementById(mesEl).classList.remove('hidden');
        } else if (tipoSeleccionado === 'anual') {
            document.getElementById(anioEl).classList.remove('hidden');
        }
    }

    // --- LÓGICA DE "REGISTROS" --- //
    function renderRegistros(registros) {
        if (!listaRegistros) return;
        listaRegistros.innerHTML = '';
        if (registros.length === 0) {
            listaRegistros.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 1rem;">No hay registros para mostrar con estos filtros.</p>';
            return;
        }
        
        registros.forEach(tx => {
            const item = document.createElement('div');
            item.className = 'registro-item';
            const esGasto = tx.tipo === 'gasto';
            const signo = esGasto ? '-' : '+';
            
            item.innerHTML = `
                <div class="info">
                    <span class="categoria">${tx.categoria}</span>
                    <span class="descripcion">${tx.descripcion}</span>
                    <span class="fecha">${new Date(tx.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div class="monto ${tx.tipo}">
                    ${signo}$${tx.monto.toFixed(2)}
                </div>
                <button class="btn-edit-registro" data-id="${tx.id}" aria-label="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            `;
            listaRegistros.appendChild(item);
        });
    }
    
    // --- REQ 1: LÓGICA DE EXPORTAR A EXCEL --- //
    function exportToExcel() {
        if (typeof XLSX === 'undefined') {
            showCustomAlert('Error', 'No se pudo cargar la biblioteca de exportación. Revisa tu conexión a internet.');
            return;
        }
        
        // Usar los mismos filtros que se están mostrando en la lista
        const data = getFilteredTransactions();
        
        if (data.length === 0) {
            showCustomAlert('Información', 'No hay registros para exportar con los filtros actuales.');
            return;
        }

        // Formatear los datos para el Excel
        const dataToExport = data.map(tx => ({
            'Fecha': tx.fecha,
            'Tipo': tx.tipo === 'gasto' ? 'Gasto' : 'Ingreso',
            'Categoria': tx.categoria,
            'Monto (USD)': tx.monto,
            'Descripcion': tx.descripcion
        }));

        // Crear la hoja de cálculo
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        // Crear el libro de trabajo
        const wb = XLSX.utils.book_new();
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Registros');
        
        // Auto-ajustar columnas (opcional pero recomendado)
        const cols = Object.keys(dataToExport[0]).map(key => ({
            wch: Math.max(key.length, ...dataToExport.map(row => String(row[key]).length)) + 2
        }));
        ws['!cols'] = cols;

        // Descargar el archivo
        XLSX.writeFile(wb, 'Registros_Gastos.xlsx');
    }


    // --- LÓGICA DE "RESUMEN" (Gráficos y Balance) --- //
    
    function renderBalance(registros) {
        if (!totalIngresosEl) return;
        const ingresos = registros.filter(tx => tx.tipo === 'ingreso').reduce((acc, tx) => acc + tx.monto, 0);
        const gastos = registros.filter(tx => tx.tipo === 'gasto').reduce((acc, tx) => acc + tx.monto, 0);
        const balance = ingresos - gastos;

        totalIngresosEl.textContent = `$${ingresos.toFixed(2)}`;
        totalGastosEl.textContent = `$${gastos.toFixed(2)}`;
        balanceNetoEl.textContent = `$${balance.toFixed(2)}`;
        
        balanceNetoEl.style.color = balance >= 0 ? 'var(--ingreso-color)' : 'var(--gasto-color)';
    }

    function renderCharts(registros) {
        if (!ctxGastos || !ctxIngresos) return;
        
        const gastos = registros.filter(tx => tx.tipo === 'gasto');
        const ingresos = registros.filter(tx => tx.tipo === 'ingreso');

        const dataGastos = procesarDatosGrafico(gastos);
        const dataIngresos = procesarDatosGrafico(ingresos);

        if (chartGastos) chartGastos.destroy();
        if (chartIngresos) chartIngresos.destroy();

        // *** INICIO DE LA CORRECCIÓN ***
        const chartOptions = (title) => ({
            responsive: true,
            maintainAspectRatio: true, // ESTO SE CAMBIÓ DE 'false' A 'true'
            aspectRatio: 1, // AÑADIDO: Esto fuerza un aspecto 1:1 (redondo)
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: getComputedStyle(document.body).getPropertyValue('--text-dark') 
                    } 
                },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: $${context.parsed.toFixed(2)}`
                    }
                }
            }
        });
        // *** FIN DE LA CORRECCIÓN ***

        chartGastos = new Chart(ctxGastos, {
            type: 'pie',
            data: {
                labels: dataGastos.labels,
                datasets: [{ data: dataGastos.data, backgroundColor: ['#E74C3C', '#C0392B', '#FF7675', '#D63031', '#F1948A', '#EC7063'], borderWidth: 1 }]
            },
            options: chartOptions('Gastos')
        });

        chartIngresos = new Chart(ctxIngresos, {
            type: 'pie',
            data: {
                labels: dataIngresos.labels,
                datasets: [{ data: dataIngresos.data, backgroundColor: ['#2ECC71', '#27AE60', '#58D68D', '#1ABC9C', '#ABEBC6', '#16A085'], borderWidth: 1 }]
            },
            options: chartOptions('Ingresos')
        });
    }

    function procesarDatosGrafico(transacciones) {
        const dataAgrupada = transacciones.reduce((acc, tx) => {
            acc[tx.categoria] = (acc[tx.categoria] || 0) + tx.monto;
            return acc;
        }, {});
        return { labels: Object.keys(dataAgrupada), data: Object.values(dataAgrupada) };
    }

    // --- LÓGICA DE "CONFIGURACIÓN" --- //
    
    // REQ 2: Función para disparar el prompt de instalación
    async function installPWA() {
        if (!deferredInstallPrompt) {
            showCustomAlert('Información', 'La aplicación no se puede instalar en este momento o ya está instalada.');
            return;
        }
        // Mostrar el prompt de instalación del navegador
        deferredInstallPrompt.prompt();
        // Esperar la decisión del usuario
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('El usuario aceptó instalar la PWA');
        } else {
            console.log('El usuario rechazó instalar la PWA');
        }
        // Limpiar el prompt (solo se puede usar una vez)
        deferredInstallPrompt = null;
        // Ocultar el botón
        btnInstallPWA.classList.add('hidden');
    }
    
    // Tema
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggle.checked = theme === 'dark';
    }

    function toggleTheme() {
        currentTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
        if (activePage === 'resumen') updateUI(); 
    }

    // Categorías
    function renderCategoriasConfig() {
        if (!listaCatGasto || !listaCatIngreso) return;
        listaCatGasto.innerHTML = '';
        listaCatIngreso.innerHTML = '';
        
        if (!categorias.gasto.includes('Otros')) categorias.gasto.push('Otros');
        if (!categorias.ingreso.includes('Otros')) categorias.ingreso.push('Otros');

        categorias.gasto.forEach(cat => renderCategoriaItem(cat, 'gasto', listaCatGasto));
        categorias.ingreso.forEach(cat => renderCategoriaItem(cat, 'ingreso', listaCatIngreso));
    }

    function renderCategoriaItem(categoria, tipo, listaElemento) {
        const isOther = categoria.toLowerCase() === 'otros';
        const item = document.createElement('li');
        item.className = 'categoria-item';
        item.dataset.tipo = tipo;
        item.dataset.categoria = categoria;
        
        item.innerHTML = `
            <span>${categoria}</span>
            ${!isOther ? `
            <div class="categoria-item-actions">
                <button class="btn-edit-cat" aria-label="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-delete-cat" aria-label="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
            ` : `<span style="color: var(--text-light); font-style: italic;">(Categoría por defecto)</span>`}
        `;
        listaElemento.appendChild(item);
    }

    function agregarCategoria(e) {
        e.preventDefault();
        const nombre = inputNuevaCategoria.value.trim();
        const tipo = selectTipoCategoria.value;
        
        if (!nombre) return;
        if (categorias[tipo].find(c => c.toLowerCase() === nombre.toLowerCase())) {
            showCustomAlert('Error', 'Esa categoría ya existe.');
            return;
        }

        categorias[tipo].push(nombre);
        saveCategorias();
        renderCategoriasConfig();
        inputNuevaCategoria.value = '';
    }

    function handleCategoriaClick(e) {
        const btnDelete = e.target.closest('.btn-delete-cat');
        const btnEdit = e.target.closest('.btn-edit-cat');
        
        if (btnDelete) {
            const item = btnDelete.closest('.categoria-item');
            const { tipo, categoria } = item.dataset;
            showConfirmation('¿Estás seguro?', `¿Quieres eliminar la categoría "${categoria}"? Las transacciones existentes se moverán a "Otros".`, () => {
                eliminarCategoria(tipo, categoria);
            });
        }
        
        if (btnEdit) {
            const item = btnEdit.closest('.categoria-item');
            const { tipo, categoria } = item.dataset;
            startEditarCategoria(tipo, categoria);
        }
    }

    function eliminarCategoria(tipo, categoria) {
        transactions.forEach(tx => {
            if (tx.tipo === tipo && tx.categoria === categoria) {
                tx.categoria = 'Otros';
            }
        });
        saveTransactions();

        categorias[tipo] = categorias[tipo].filter(cat => cat !== categoria);
        saveCategorias();
        renderCategoriasConfig();
        showCustomAlert('Éxito', 'Categoría eliminada.');
    }

    function startEditarCategoria(tipo, oldCategoria) {
        const modalEditHtml = `
            <form id="form-edit-cat" data-tipo="${tipo}" data-old-cat="${oldCategoria}">
                <div class="form-group">
                    <label for="input-new-cat-name">Nuevo nombre para "${oldCategoria}"</label>
                    <input type="text" id="input-new-cat-name" value="${oldCategoria}" required>
                </div>
                <button type="submit" class="btn-submit">Guardar Nombre</button>
            </form>
        `;

        showModal('Editar Categoría', modalEditHtml);
        
        document.getElementById('form-edit-cat').addEventListener('submit', (e) => {
            e.preventDefault();
            const newNombre = document.getElementById('input-new-cat-name').value.trim();
            
            if (!newNombre || newNombre === oldCategoria) {
                hideModal();
                return;
            }

            if (categorias[tipo].find(c => c.toLowerCase() === newNombre.toLowerCase())) {
                showCustomAlert('Error', 'Ese nombre de categoría ya existe.');
                return;
            }

            transactions.forEach(tx => {
                if (tx.tipo === tipo && tx.categoria === oldCategoria) {
                    tx.categoria = newNombre;
                }
            });
            saveTransactions();

            const index = categorias[tipo].indexOf(oldCategoria);
            if (index > -1) {
                categorias[tipo][index] = newNombre;
            }
            saveCategorias();
            renderCategoriasConfig();
            hideModal();
            showCustomAlert('Éxito', 'Categoría actualizada.');
        });
    }


    // --- LÓGICA DE MODAL --- //
    
    function showModal(title, contentHtml) {
        modalTitle.textContent = title;
        modalContent.innerHTML = contentHtml;
        modalContainer.classList.remove('hidden');
    }

    function hideModal() {
        modalContainer.classList.add('hidden');
        modalTitle.innerHTML = '';
        modalContent.innerHTML = '';
    }

    function showCustomAlert(title, message) {
        const alertHtml = `<p>${message}</p>`;
        showModal(title, alertHtml);
    }
    
    function showConfirmation(title, message, onConfirm) {
        const confirmHtml = `
            <p>${message}</p>
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                <button id="btn-confirm-cancel" class="btn-submit" style="background: var(--text-light); width: 120px;">Cancelar</button>
                <button id="btn-confirm-ok" class="btn-submit" style="background: var(--gasto-color); width: 120px;">Confirmar</button>
            </div>
        `;
        showModal(title, confirmHtml);

        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        btnOk.onclick = () => {
            onConfirm();
            hideModal();
        };
        btnCancel.onclick = hideModal;
    }

    // --- Arrancar la aplicación --- //
    init();
});


