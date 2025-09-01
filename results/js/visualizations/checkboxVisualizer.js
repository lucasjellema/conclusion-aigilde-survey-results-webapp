/**
 * checkboxVisualizer.js
 * Visualization component for checkbox questions
 * 
 * This module creates visualizations for checkbox-type questions (multiple selection)
 * using various chart types such as horizontal bar, vertical bar, stacked bar, and radar charts.
 */

import { aggregateCheckboxResponses } from '../resultsDataService.js';

// Ensure Chart.js is loaded
if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded. Please ensure chart.js is included before this script.');
}

// Add modal HTML to the body if it doesn't exist
if (!document.getElementById('otherValuesModal')) {
    const modalHtml = `
        <div id="otherValuesModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="otherValuesModalTitle">Other Values</h3>
                    <span class="close-button">&times;</span>
                </div>
                <div class="modal-body">
                    <ul id="otherValuesList" class="other-values-list">
                        <!-- Other values will be inserted here -->
                    </ul>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Get the modal elements
const otherValuesModal = document.getElementById('otherValuesModal');
const otherValuesModalTitle = document.getElementById('otherValuesModalTitle');
const otherValuesList = document.getElementById('otherValuesList');
const closeButton = otherValuesModal ? otherValuesModal.querySelector('.close-button') : null;

// Close the modal when the close button is clicked
if (closeButton) {
    closeButton.onclick = function() {
        otherValuesModal.style.display = 'none';
    };
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target === otherValuesModal) {
        otherValuesModal.style.display = 'none';
    }
};

/**
 * Displays a modal with a list of "other" values and their associated respondents.
 * @param {string} title - The title for the modal.
 * @param {Array<Object>} otherValues - An array of objects, each with 'respondent' and 'value' properties.
 */
function showOtherValuesModal(title, otherValues) {
    if (!otherValuesModal || !otherValuesModalTitle || !otherValuesList) {
        console.error('Modal elements not found.');
        return;
    }

    otherValuesModalTitle.textContent = title;
    otherValuesList.innerHTML = ''; // Clear previous list

    if (otherValues && otherValues.length > 0) {
        otherValues.forEach(item => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="respondent-name">${item.respondent}:</span>
                <span class="other-value-text">${item.value}</span>
            `;
            otherValuesList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = 'No "other" values found for this option.';
        otherValuesList.appendChild(listItem);
    }

    otherValuesModal.style.display = 'flex'; // Use flex to center the modal content
}

/**
 * Create a visualization for checkbox question responses
 * @param {HTMLElement} container - The DOM element to render the chart in
 * @param {Array} responses - Array of question responses
 * @param {Object} question - The question definition
 * @param {string} [type='horizontalBar'] - Type of visualization ('horizontalBar', 'verticalBar', 'stackedBar', 'radar')
 */
export function createCheckboxVisualization(container, responses, question, responseLabels,type = 'horizontalBar') {
    if (!container || !Array.isArray(responses) || responses.length === 0) {
        container.innerHTML = '<p class="no-data">No data available for this question.</p>';
        return;
    }
    
    // Aggregate responses
    const aggregatedData = aggregateCheckboxResponses(responses, question, responseLabels);
    
    // Don't render if no data
    if (aggregatedData.totalResponses === 0) {
        container.innerHTML = '<p class="no-data">No responses for this question yet.</p>';
        return;
    }
    
    // Render appropriate chart based on type
    switch (type) {
        case 'horizontalBar':
            renderBarChart(container, aggregatedData, question, true);
            break;
        case 'verticalBar':
            renderBarChart(container, aggregatedData, question, false);
            break;
        case 'stackedBar':
            renderStackedBarChart(container, aggregatedData, question);
            break;
        case 'radar':
            renderRadarChart(container, aggregatedData, question);
            break;
        default:
            renderBarChart(container, aggregatedData, question, true);
    }
    
    // Add a summary text for accessibility
    addSummaryText(container, aggregatedData);
}

/**
 * Render a bar chart
 * @param {HTMLElement} container - Chart container
 * @param {Object} data - Aggregated data
 * @param {Object} question - Question definition
 * @param {boolean} horizontal - Whether to render a horizontal bar chart
 */
function renderBarChart(container, data, question, horizontal = false) {
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${question.id}`;
    canvas.width = 600;
    canvas.height = 400;
    
    // Clear container and add canvas
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Default color palette
    const colors = [
        '#4a86e8', '#6aa84f', '#e69138', '#8e63ce', '#d5573b',
        '#45818e', '#a64d79', '#674ea7', '#990000', '#0c343d'
    ];
    
    // Create chart configuration
    const config = {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Responses',
                data: data.data,
                backgroundColor: data.labels.map((_, i) => colors[i % colors.length]),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = data.percentages[context.dataIndex];
                            
                            const associatedLabels = data.tooltipLabels[context.dataIndex] || [];
                            return `${value} (${percentage}%)${associatedLabels}`;
                        }
                    }
                },
                datalabels: {
                    formatter: (value) => {
                        return value > 0 ? value : '';
                    },
                    color: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        return value > 5 ? '#fff' : '#333'; // Change text color based on bar height
                    },
                    font: {
                        weight: 'bold'
                    },
                    anchor: horizontal ? 'end' : 'end',
                    align: horizontal ? 'right' : 'top',
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: !horizontal,
                    },
                    title: {
                        display: !horizontal,
                        text: 'Number of Responses',
                        padding: {
                            top: 10
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: horizontal,
                    },
                    title: {
                        display: horizontal,
                        text: 'Number of Responses',
                        padding: {
                            bottom: 10
                        }
                    }
                }
            }
        }
    };
    
    // Create chart
    const chart = new Chart(canvas, config);

    // Add click event listener to the chart
    canvas.onclick = function(evt) {
        const activePoints = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (activePoints.length > 0) {
            const firstPoint = activePoints[0];
            const dataIndex = firstPoint.index;
            const label = data.labels[dataIndex];

            // Check if the clicked label is 'Other' and if there are otherValuesDetails
            if ( data.otherValuesDetails && data.otherValuesDetails['other']) {
                showOtherValuesModal(`Details for "${label}"`, data.otherValuesDetails['other']);
            }
        }
    };
}

/**
 * Render a stacked bar chart showing selected vs. not selected
 * @param {HTMLElement} container - Chart container
 * @param {Object} data - Aggregated data
 * @param {Object} question - Question definition
 */
function renderStackedBarChart(container, data, question) {
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${question.id}`;
    canvas.width = 600;
    canvas.height = 400;
    
    // Clear container and add canvas
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Calculate the "not selected" values
    const notSelectedData = data.labels.map((_, i) => {
        return data.totalResponses - data.data[i];
    });
    
    // Create chart configuration
    const config = {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Selected',
                    data: data.data,
                    backgroundColor: '#4a86e8',
                    borderWidth: 1
                },
                {
                    label: 'Not Selected',
                    data: notSelectedData,
                    backgroundColor: '#e0e0e0',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 10
                    },
                    maxHeight: 80,
                    maxWidth: 350
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            const percentage = Math.round((value / data.totalResponses) * 100);
                            // For stacked bar, we need to get the labels for the specific segment (Selected/Not Selected)
                            // This might require more complex logic if we want to show labels for 'Not Selected'
                            // For now, only show labels for 'Selected' segment
                            if (context.datasetIndex === 0) { // 'Selected' dataset

                                
                           const associatedLabels = data.tooltipLabels[context.dataIndex] || [];
                            return `${value} (${percentage}%)${associatedLabels}`;
                             }
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    formatter: (value, context) => {
                        // Only show percentage for non-zero values
                        if (value === 0) return '';
                        
                        const percentage = Math.round((value / data.totalResponses) * 100);
                        return `${percentage}%`;
                    },
                    color: function(context) {
                        // White text on blue background, black text on gray background
                        return context.datasetIndex === 0 ? '#fff' : '#333';
                    },
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    max: data.totalResponses,
                    title: {
                        display: true,
                        text: 'Number of Responses',
                        padding: {
                            top: 10
                        }
                    }
                },
                y: {
                    stacked: true
                }
            }
        }
    };
    
    // Create chart
    const chart = new Chart(canvas, config);

    // Add click event listener to the chart
    canvas.onclick = function(evt) {
        const activePoints = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (activePoints.length > 0) {
            const firstPoint = activePoints[0];
            const dataIndex = firstPoint.index;
            const label = data.labels[dataIndex];

            // Check if the clicked label is 'Other' and if there are otherValuesDetails
            if (label === 'Other' && data.otherValuesDetails && data.otherValuesDetails['other']) {
                showOtherValuesModal(`Details for "${label}"`, data.otherValuesDetails['other']);
            }
        }
    };
}

/**
 * Render a radar chart for checkbox responses
 * @param {HTMLElement} container - Chart container
 * @param {Object} data - Aggregated data
 * @param {Object} question - Question definition
 */
function renderRadarChart(container, data, question) {
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${question.id}`;
    canvas.width = 500;
    canvas.height = 500;
    
    // Clear container and add canvas
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Create chart configuration
    const config = {
        type: 'radar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Selected',
                    data: data.data,
                    backgroundColor: 'rgba(74, 134, 232, 0.2)',
                    borderColor: '#4a86e8',
                    borderWidth: 2,
                    pointBackgroundColor: '#4a86e8',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0.2 // Slight curve to the lines
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    angleLines: {
                        display: true
                    },
                    suggestedMax: Math.max(...data.data) + 1
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = data.percentages[context.dataIndex];
                           const associatedLabels = data.tooltipLabels[context.dataIndex] || [];
                            return `${value} (${percentage}%)` + (associatedLabels.length > 0 ? `\n${associatedLabels}` : '');
                         }
                    }
                },
                datalabels: {
                    formatter: (value) => {
                        return value > 0 ? value : '';
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    anchor: 'end',
                    align: 'end',
                    offset: 5
                }
            }
        }
    };
    
    // Create chart
    const chart = new Chart(canvas, config);

    // Add click event listener to the chart
    canvas.onclick = function(evt) {
        const activePoints = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (activePoints.length > 0) {
            const firstPoint = activePoints[0];
            const dataIndex = firstPoint.index;
            const label = data.labels[dataIndex];

            // Check if the clicked label is 'Other' and if there are otherValuesDetails
            if (label === 'Other' && data.otherValuesDetails && data.otherValuesDetails['other']) {
                showOtherValuesModal(`Details for "${label}"`, data.otherValuesDetails['other']);
            }
        }
    };
}

/**
 * Add summary text below chart for accessibility
 * @param {HTMLElement} container - Chart container
 * @param {Object} data - Aggregated data
 */
function addSummaryText(container, data) {
    const summary = document.createElement('div');
    summary.className = 'visualization-summary';
    
    // Create a summary of the data
    const total = data.totalResponses;
    const topOptions = [...data.labels]
        .map((label, i) => ({ label, count: data.data[i], percentage: data.percentages[i] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    
    let summaryText = `<p>Based on ${total} responses, the top selections were: `;
    
    topOptions.forEach((option, i) => {
        if (i > 0) {
            summaryText += i === topOptions.length - 1 ? ' and ' : ', ';
        }
        summaryText += `"${option.label}" (${option.count} responses, ${option.percentage}%)`;
    });
    
    summaryText += '.</p>';
    
    summary.innerHTML = summaryText;
    container.appendChild(summary);

    // Add extra space at the bottom to accommodate legends
    const spacer = document.createElement('div');
    spacer.className = 'legend-spacer';
    spacer.style.height = '40px';
    container.appendChild(spacer);
}
