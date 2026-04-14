// ==========================================
// Визуализация матрицы в 3D (Plotly)
// ==========================================

/**
 * Показать 3D поверхность матрицы текущего активного файла
 */
function showMatrix3DSurface() {
    const file = getActiveFile();
    if (!file) {
        alert('Нет открытого файла с матрицей!');
        return;
    }

    const matrix = file.matrix;
    if (!matrix || matrix.length === 0) {
        alert('Матрица пуста!');
        return;
    }

    const container = document.getElementById('matrixPlotContainer');
    if (!container) {
        console.error('Контейнер matrixPlotContainer не найден');
        return;
    }

    // Получаем настройки
    const colormap = document.getElementById('matrixColormap').value || 'Viridis';
    const showContours = document.getElementById('matrixShowContours').checked;

    // Создаем данные для осей X и Y
    const height = matrix.length;
    const width = matrix[0].length;
    
    const xValues = Array.from({length: width}, (_, i) => i);
    const yValues = Array.from({length: height}, (_, i) => i);
    
    // Plotly ожидает данные в формате z[y][x]
    const zValues = matrix;

    // Настраиваем данные для surface plot
    const data = [{
        z: zValues,
        x: xValues,
        y: yValues,
        type: 'surface',
        colorscale: colormap,
        showscale: true,
        contours: {
            z: {
                show: showContours,
                usecolormap: true,
                highlightcolor: "#42f462",
                project: {
                    z: showContours
                }
            }
        }
    }];

    // Настраиваем layout
    const layout = {
        title: `3D визуализация матрицы (${width}×${height})`,
        autosize: true,
        scene: {
            xaxis: {
                title: 'X',
                zeroline: false
            },
            yaxis: {
                title: 'Y',
                zeroline: false
            },
            zaxis: {
                title: 'Значение',
                zeroline: false
            },
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.2}
            }
        },
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 50
        }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        scrollZoom: true,
        displaylogo: false
    };

    // Рендерим график
    Plotly.newPlot('matrixPlotContainer', data, layout, config);
}

/**
 * Обновить график матрицы (при изменении настроек)
 */
function refreshMatrixPlot() {
    const file = getActiveFile();
    if (!file) {
        return;
    }

    const matrix = file.matrix;
    if (!matrix || matrix.length === 0) {
        return;
    }

    const container = document.getElementById('matrixPlotContainer');
    if (!container || !container.data) {
        // Если график еще не создан, создаем его
        showMatrix3DSurface();
        return;
    }

    // Получаем настройки
    const colormap = document.getElementById('matrixColormap').value || 'Viridis';
    const showContours = document.getElementById('matrixShowContours').checked;

    // Обновляем данные графика
    const height = matrix.length;
    const width = matrix[0].length;
    
    const xValues = Array.from({length: width}, (_, i) => i);
    const yValues = Array.from({length: height}, (_, i) => i);
    const zValues = matrix;

    const update = {
        'z': [zValues],
        'x': [xValues],
        'y': [yValues],
        'colorscale': [[0, colormap]],
        'contours.z.show': showContours,
        'contours.z.project.z': showContours
    };

    Plotly.restyle('matrixPlotContainer', update);
}

/**
 * Автоматически обновлять визуализацию при переключении на вкладку "Матрица"
 */
document.addEventListener('DOMContentLoaded', function() {
    const matrixTabBtn = document.querySelector('.tab-btn[data-tab="matrix"]');
    if (matrixTabBtn) {
        matrixTabBtn.addEventListener('click', function() {
            // Небольшая задержка чтобы панель успела стать активной
            setTimeout(() => {
                const file = getActiveFile();
                if (file && file.matrix) {
                    const container = document.getElementById('matrixPlotContainer');
                    if (container && container.data) {
                        // График уже существует, обновляем
                        refreshMatrixPlot();
                    } else {
                        // Создаем новый график
                        showMatrix3DSurface();
                    }
                }
            }, 100);
        });
    }
});
