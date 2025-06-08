// API Configuration
const API_BASE_URL = 'restapi.php';
let vehicles = [];
let currentEditId = null;
let filteredVehicles = [];

// Utility function to safely get element
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID '${id}' not found`);
        return null;
    }
    return element;
}
// Debug helper
window.addEventListener('load', function() {
    console.log('Window fully loaded');
    console.log('vehiclesContainer exists:', !!document.getElementById('vehiclesContainer'));
    console.log('alertContainer exists:', !!document.getElementById('alertContainer'));
});

// Load vehicles on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing...');

    // Wait a bit for all elements to be ready
    setTimeout(() => {
        loadVehicles();
        loadStatistics();
    }, 100);

    // Search on Enter key
    const searchInput = safeGetElement('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                searchVehicles();
            }
        });

        // Search on input (with debounce)
        let searchTimeout;
        searchInput.addEventListener('input', function (e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchVehicles();
            }, 300);
        });
    }

    // Form submission
    const vehicleForm = safeGetElement('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveVehicle();
        });
    }
});

// Load vehicles from API
async function loadVehicles() {
    try {
        console.log('Loading vehicles...');
        showLoading();

        const response = await fetch(API_BASE_URL);
        console.log('API Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Result:', result);

        vehicles = result.data || [];
        filteredVehicles = [...vehicles];

        console.log('Vehicles loaded:', vehicles.length);
        displayVehicles(vehicles);

    } catch (error) {
        console.error('Error loading vehicles:', error);
        showAlert('Error memuat data kendaraan: ' + error.message, 'error');
        showNoDataMessage('Tidak dapat memuat data kendaraan');
    }
}

// Load statistics from API
async function loadStatistics() {
    try {
        console.log('Loading statistics...');
        const response = await fetch(`${API_BASE_URL}?stats=true`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Stats result:', result);
        const stats = result.data;

        const totalElement = safeGetElement('totalVehicles');
        const availableElement = safeGetElement('availableVehicles');
        const soldElement = safeGetElement('soldVehicles');
        const maintenanceElement = safeGetElement('maintenanceVehicles');

        if (totalElement) totalElement.textContent = stats.total || 0;
        if (availableElement) availableElement.textContent = stats.available || 0;
        if (soldElement) soldElement.textContent = stats.sold || 0;
        if (maintenanceElement) maintenanceElement.textContent = stats.maintenance || 0;

    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values if API fails
        const elements = ['totalVehicles', 'availableVehicles', 'soldVehicles', 'maintenanceVehicles'];
        elements.forEach(id => {
            const element = safeGetElement(id);
            if (element) element.textContent = '-';
        });
    }
}

// Search vehicles
async function searchVehicles() {
    const searchInput = safeGetElement('searchInput');
    const statusFilter = safeGetElement('statusFilter');

    const keyword = searchInput ? searchInput.value.trim() : '';
    const statusValue = statusFilter ? statusFilter.value : '';

    try {
        console.log('Searching vehicles...', { keyword, statusValue });
        showLoading();

        let url = API_BASE_URL;
        let params = new URLSearchParams();

        if (keyword) {
            params.append('search', keyword);
        }

        if (statusValue) {
            params.append('status', statusValue);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        filteredVehicles = result.data || [];
        displayVehicles(filteredVehicles);

    } catch (error) {
        console.error('Error searching vehicles:', error);
        showAlert('Error mencari kendaraan: ' + error.message, 'error');
    }
}

// Display vehicles in grid
function displayVehicles(vehiclesToShow) {
    console.log('Displaying vehicles:', vehiclesToShow?.length || 0);

    const container = safeGetElement('vehiclesContainer');
    if (!container) {
        console.error('vehiclesContainer not found!');
        return;
    }

    if (!vehiclesToShow || vehiclesToShow.length === 0) {
        showNoDataMessage();
        return;
    }

    const vehiclesHTML = vehiclesToShow.map(vehicle => `
        <div class="vehicle-card">
            <div class="vehicle-header">
                <div class="vehicle-title">
                    <h3>${vehicle.brand} ${vehicle.model}</h3>
                    <p>Tahun ${vehicle.year}</p>
                </div>
                <span class="status-badge status-${vehicle.status}">
                    ${getStatusText(vehicle.status)}
                </span>
            </div>
            
            <div class="vehicle-details">
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-id-card"></i> Plat Nomor</span>
                    <span class="detail-value">${vehicle.license_plate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-palette"></i> Warna</span>
                    <span class="detail-value">${vehicle.color || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-cog"></i> Tipe Mesin</span>
                    <span class="detail-value">${vehicle.engine_type || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-gas-pump"></i> Bahan Bakar</span>
                    <span class="detail-value">${getFuelTypeText(vehicle.fuel_type)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><i class="fas fa-money-bill-wave"></i> Harga</span>
                    <span class="detail-value price">${formatPrice(vehicle.price)}</span>
                </div>
            </div>
            
            <div class="vehicle-actions">
                <button class="btn btn-warning btn-sm" onclick="editVehicle(${vehicle.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${vehicle.id})">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="vehicles-grid">${vehiclesHTML}</div>`;
}

// Show loading indicator
function showLoading() {
    const container = safeGetElement('vehiclesContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <i class="fas fa-spinner" style="font-size: 3rem; animation: spin 1s linear infinite; margin-bottom: 20px;"></i>
            <p style="font-size: 1.2rem;">Memuat data kendaraan...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// Show no data message
function showNoDataMessage(message = 'Tidak ada kendaraan ditemukan') {
    const container = safeGetElement('vehiclesContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="no-vehicles">
            <i class="fas fa-car"></i>
            <h3>${message}</h3>
            <p>Silakan tambah kendaraan baru atau ubah kriteria pencarian</p>
        </div>
    `;
}

// Filter by status
function filterByStatus() {
    searchVehicles();
}

// Edit vehicle - fetch from API
async function editVehicle(id) {
    try {
        const response = await fetch(`${API_BASE_URL}?id=${id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.data) {
            currentEditId = id;
            const modalTitle = safeGetElement('modalTitle');
            if (modalTitle) modalTitle.textContent = 'Edit Kendaraan';

            const vehicle = result.data;
            const fields = [
                { id: 'brand', value: vehicle.brand },
                { id: 'model', value: vehicle.model },
                { id: 'year', value: vehicle.year },
                { id: 'color', value: vehicle.color || '' },
                { id: 'license_plate', value: vehicle.license_plate },
                { id: 'engine_type', value: vehicle.engine_type || '' },
                { id: 'fuel_type', value: vehicle.fuel_type },
                { id: 'price', value: vehicle.price },
                { id: 'status', value: vehicle.status }
            ];

            fields.forEach(field => {
                const element = safeGetElement(field.id);
                if (element) element.value = field.value;
            });

            const modal = safeGetElement('vehicleModal');
            if (modal) modal.style.display = 'block';
        } else {
            showAlert('Kendaraan tidak ditemukan', 'error');
        }
    } catch (error) {
        console.error('Error loading vehicle:', error);
        showAlert('Error memuat data kendaraan: ' + error.message, 'error');
    }
}

// Save vehicle (create or update) - API call
async function saveVehicle() {
    const vehicleForm = safeGetElement('vehicleForm');
    if (!vehicleForm) return;

    const formData = new FormData(vehicleForm);
    const data = Object.fromEntries(formData);

    // Client-side validation
    if (!data.brand || !data.model || !data.year || !data.license_plate) {
        showAlert('Harap isi semua field yang wajib (*)', 'error');
        return;
    }

    try {
        let response;
        const requestData = {
            brand: data.brand,
            model: data.model,
            year: parseInt(data.year),
            color: data.color || '',
            license_plate: data.license_plate,
            engine_type: data.engine_type || '',
            fuel_type: data.fuel_type,
            price: parseFloat(data.price) || 0,
            status: data.status
        };

        if (currentEditId) {
            // Update existing vehicle
            response = await fetch(`${API_BASE_URL}?id=${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
        } else {
            // Create new vehicle
            response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
        }

        if (!response.ok) {
            const errorResult = await response.json();
            if (errorResult.errors) {
                showAlert('Validation Error: ' + errorResult.errors.join(', '), 'error');
            } else {
                showAlert('Error: ' + errorResult.message, 'error');
            }
            return;
        }

        const result = await response.json();
        showAlert(result.message, 'success');
        closeModal();

        // Reload data
        await loadVehicles();
        await loadStatistics();

        // Reset search if active
        const searchInput = safeGetElement('searchInput');
        const statusFilter = safeGetElement('statusFilter');
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';

    } catch (error) {
        console.error('Error saving vehicle:', error);
        showAlert('Error menyimpan data: ' + error.message, 'error');
    }
}

// Delete vehicle - API call
async function deleteVehicle(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kendaraan ini?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorResult = await response.json();
            showAlert('Error: ' + errorResult.message, 'error');
            return;
        }

        const result = await response.json();
        showAlert(result.message, 'success');

        // Reload data
        await loadVehicles();
        await loadStatistics();

        // Reset search if active
        const searchInput = safeGetElement('searchInput');
        const statusFilter = safeGetElement('statusFilter');
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';

    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showAlert('Error menghapus data: ' + error.message, 'error');
    }
}

// Close modal
function closeModal() {
    const modal = safeGetElement('vehicleModal');
    if (modal) {
        modal.style.display = 'none';
        currentEditId = null;
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = safeGetElement('alertContainer');
    if (!alertContainer) return;

    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';

    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        </div>
    `;

    // Auto hide after 5 seconds
    setTimeout(() => {
        if (alertContainer) alertContainer.innerHTML = '';
    }, 5000);
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'available': 'Tersedia',
        'sold': 'Terjual',
        'maintenance': 'Maintenance',
        'reserved': 'Reservasi'
    };
    return statusMap[status] || status;
}

function getFuelTypeText(fuelType) {
    const fuelMap = {
        'gasoline': 'Bensin',
        'diesel': 'Diesel',
        'electric': 'Listrik',
        'hybrid': 'Hybrid'
    };
    return fuelMap[fuelType] || fuelType;
}

function formatPrice(price) {
    if (!price || price == 0) return '-';
    return 'Rp ' + parseInt(price).toLocaleString('id-ID');
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = safeGetElement('vehicleModal');
    if (modal && event.target === modal) {
        closeModal();
    }
}

// Open add modal
function openAddModal() {
    currentEditId = null;
    const modalTitle = safeGetElement('modalTitle');
    const vehicleForm = safeGetElement('vehicleForm');
    const modal = safeGetElement('vehicleModal');

    if (modalTitle) modalTitle.textContent = 'Tambah Kendaraan Baru';
    if (vehicleForm) vehicleForm.reset();
    if (modal) modal.style.display = 'block';
}