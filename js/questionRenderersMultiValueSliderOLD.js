/**
 * questionRenderersMultiValueSlider.js
 * Multi-value slider question renderer
 * 
 * This module provides functions to render multi-value slider questions
 * where users can position multiple options on a horizontal bar.
 */

import * as surveyData from './surveyData.js';

// Constants
const DRAG_STATE = {
  idle: 'idle',
  dragging: 'dragging'
};

/**
 * Render a multi-value slider question
 * @param {Object} question - The question object
 * @returns {HTMLElement} - The rendered question element
 */
export function renderMultiValueSlider(question) {
  // Get the question container (shared across all question types)
  const container = document.createElement('div');
  container.className = 'survey-question';
  container.id = `question-${question.id}`;
  container.dataset.questionId = question.id;
  container.dataset.questionType = question.type;
  
  // Add required marker if needed
  if (question.required) {
    container.classList.add('required');
  }
  
  // Create question title
  const title = document.createElement('h3');
  title.className = 'question-title';
  title.textContent = question.title;
  if (question.required) {
    const requiredMarker = document.createElement('span');
    requiredMarker.className = 'required-marker';
    requiredMarker.textContent = ' *';
    title.appendChild(requiredMarker);
  }
  container.appendChild(title);
  
  // Create question description if provided
  if (question.description) {
    const description = document.createElement('p');
    description.className = 'question-description';
    description.textContent = question.description;
    container.appendChild(description);
  }

  // Create the multi-value slider component
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'multi-value-slider-container';

  // Create the slider track
  const sliderTrack = document.createElement('div');
  sliderTrack.className = 'multi-value-slider-track';
  
  // Configure the slider track based on the mode
  const multiValueSlider = question.multiValueSlider || {};
  const mode = multiValueSlider.mode || 'discrete';
  const min = multiValueSlider.min ?? 0;
  const max = multiValueSlider.max ?? 100;
  
  // Set data attributes for the slider
  sliderTrack.dataset.mode = mode;
  sliderTrack.dataset.min = min;
  sliderTrack.dataset.max = max;
  
  // Configure the slider based on the mode (discrete or continuous)
  if (mode === 'discrete') {
    // Create zones for discrete mode
    const zones = multiValueSlider.zones || [];
    
    zones.forEach(zone => {
      const zoneEl = document.createElement('div');
      zoneEl.className = 'slider-zone';
      zoneEl.dataset.zoneId = zone.id;
      zoneEl.style.left = `${zone.start}%`;
      zoneEl.style.width = `${zone.end - zone.start}%`;
      zoneEl.style.backgroundColor = zone.color;
      
      // Add zone label if showLabels is true
      if (multiValueSlider.showLabels !== false) {
        const zoneLabel = document.createElement('div');
        zoneLabel.className = 'zone-label';
        zoneLabel.textContent = zone.label;
        zoneEl.appendChild(zoneLabel);
      }
      
      sliderTrack.appendChild(zoneEl);
    });
  } else {
    // Create gradient background for continuous mode
    const colorStart = multiValueSlider.colorStart || '#e9ecef';
    const colorEnd = multiValueSlider.colorEnd || '#007bff';
    sliderTrack.style.background = `linear-gradient(to right, ${colorStart}, ${colorEnd})`;
    
    // Add tick marks if showLabels is true
    if (multiValueSlider.showLabels !== false) {
      // Create min label
      const minLabel = document.createElement('div');
      minLabel.className = 'tick-label min-label';
      minLabel.textContent = min;
      sliderTrack.appendChild(minLabel);
      
      // Create max label
      const maxLabel = document.createElement('div');
      maxLabel.className = 'tick-label max-label';
      maxLabel.textContent = max;
      sliderTrack.appendChild(maxLabel);
    }
  }
  
  sliderContainer.appendChild(sliderTrack);
  
  // Create option markers for the slider
  const options = multiValueSlider.options || [];
  const optionsElements = [];
  const optionsData = {};
  
  // Calculate number of lanes needed based on number of options
  const numLanes = options.length;
  const laneHeight = 40; // Height of each option marker
  const totalHeight = sliderTrack.clientHeight;
  
  // Assign vertical lanes to each option
  const lanePositions = calculateLanePositions(options.length, totalHeight);
  
  // Create the option elements
  options.forEach((option, index) => {
    // Create the option marker element
    const optionEl = document.createElement('div');
    optionEl.className = 'slider-option';
    optionEl.dataset.optionId = option.id;
    optionEl.dataset.letter = option.letter;
    
    // Set the shape of the option marker
    const shape = option.shape || 'circle';
    optionEl.classList.add(`shape-${shape}`);
    
    // Create the letter inside the shape
    const letterEl = document.createElement('span');
    letterEl.className = 'option-letter';
    letterEl.textContent = option.letter;
    optionEl.appendChild(letterEl);
    
    // Create tooltip for the option label
    const tooltip = document.createElement('div');
    tooltip.className = 'option-tooltip';
    tooltip.textContent = option.label;
    optionEl.appendChild(tooltip);
    
    // Get the lane position for this option
    const initialPosition = option.defaultPosition ?? 0;
    const lanePosition = lanePositions[index];
    positionOptionElement(optionEl, initialPosition, lanePosition);
    
    // Store the option element and initial data
    optionsElements.push(optionEl);
    optionsData[option.id] = {
      position: initialPosition,
      lanePosition: lanePosition,
      element: optionEl,
      laneIndex: index
    };
    
    // Add the option element to the slider track
    sliderTrack.appendChild(optionEl);
    
    // Add drag and drop functionality
    setupDragAndDrop(optionEl, sliderTrack, option.id, question.id, lanePosition);
  });
  
  // Create legend if showLegend is true
  if (multiValueSlider.showLegend !== false) {
    const legend = document.createElement('div');
    legend.className = 'slider-legend';
    
    const legendTitle = document.createElement('p');
    legendTitle.className = 'legend-title';
    legendTitle.textContent = 'Legend:';
    legend.appendChild(legendTitle);
    
    const legendItems = document.createElement('ul');
    legendItems.className = 'legend-items';
    
    options.forEach(option => {
      const legendItem = document.createElement('li');
      legendItem.className = 'legend-item';
      
      const letterBadge = document.createElement('span');
      letterBadge.className = `letter-badge shape-${option.shape || 'circle'}`;
      letterBadge.textContent = option.letter;
      
      const itemLabel = document.createElement('span');
      itemLabel.textContent = option.label;
      
      legendItem.appendChild(letterBadge);
      legendItem.appendChild(itemLabel);
      legendItems.appendChild(legendItem);
    });
    
    legend.appendChild(legendItems);
    sliderContainer.appendChild(legend);
  }
  
  // Load existing response if available
  const existingResponse = surveyData.getResponse(question.id);
  if (existingResponse && existingResponse.value) {
    try {
      const savedPositions = existingResponse.value;
      Object.keys(savedPositions).forEach(optionId => {
        if (optionsData[optionId]) {
          const position = savedPositions[optionId];
          const lanePosition = optionsData[optionId].lanePosition;
          positionOptionElement(optionsData[optionId].element, position, lanePosition);
          optionsData[optionId].position = position;
        }
      });
    } catch (e) {
      console.error('Error loading saved positions:', e);
    }
  }
  
  // Add the slider container to the main container
  container.appendChild(sliderContainer);
  
  // Add comment field if enabled
  if (question.allowComment) {
    const commentContainer = document.createElement('div');
    commentContainer.className = 'question-comment-container';
    
    const commentLabel = document.createElement('label');
    commentLabel.htmlFor = `comment-${question.id}`;
    commentLabel.textContent = 'Additional comments:';
    
    const commentField = document.createElement('textarea');
    commentField.id = `comment-${question.id}`;
    commentField.className = 'question-comment';
    commentField.rows = 2;
    commentField.dataset.questionId = question.id;
    
    // Load existing comment if available
    if (existingResponse && existingResponse.comment) {
      commentField.value = existingResponse.comment;
    }
    
    // Add event listener to save comment
    commentField.addEventListener('blur', () => {
      const currentPositions = getCurrentPositions(optionsData);
      surveyData.saveResponse(question.id, currentPositions, commentField.value);
    });
    
    commentContainer.appendChild(commentLabel);
    commentContainer.appendChild(commentField);
    container.appendChild(commentContainer);
  }
  
  return container;
}

/**
 * Calculate vertical positions for each lane
 * @param {number} numOptions - Number of options/lanes needed
 * @param {number} totalHeight - Total height of the slider track
 * @returns {Array} - Array of vertical positions for each lane
 */
function calculateLanePositions(numOptions, totalHeight) {
  // Predefine specific lane positions for common numbers of options
  // This ensures consistent, well-spaced positioning with enough space from the top (zone labels)
  const specificLanePositions = {
    1: [150], // Center position for 1 option
    2: [80, 220], // Top and bottom positions for 2 options
    3: [80, 150, 220], // Top, middle, and bottom for 3 options
    4: [80, 120, 180, 220], // Four evenly distributed lanes
    5: [80, 115, 150, 185, 220]  // Five evenly distributed lanes
  };
  
  // If we have a predefined set of positions for this number of options, use it
  if (specificLanePositions[numOptions]) {
    return specificLanePositions[numOptions];
  }
  
  // For larger numbers, calculate positions dynamically
  const lanes = [];
  const padding = 35; // Increased padding from edges
  const usableHeight = totalHeight - (padding * 2);
  
  // For many options, distribute them evenly
  const step = usableHeight / (numOptions - 1);
  
  for (let i = 0; i < numOptions; i++) {
    const position = padding + (i * step);
    lanes.push(Math.floor(position));
  }
  
  return lanes;
}

/**
 * Set the position of an option element on the slider
 * @param {HTMLElement} optionEl - The option element
 * @param {number} position - The horizontal position (0-100)
 * @param {number} lanePosition - The vertical position in pixels
 */
function positionOptionElement(optionEl, position, lanePosition) {
  // Ensure position is between 0 and 100
  const safePosition = Math.max(0, Math.min(100, position));
  optionEl.style.left = `${safePosition}%`;
  optionEl.style.top = `${lanePosition}px`;
  optionEl.dataset.position = safePosition;
  optionEl.dataset.lane = lanePosition;
}

/**
 * Set up drag and drop functionality for an option element
 * @param {HTMLElement} optionEl - The option element
 * @param {HTMLElement} sliderTrack - The slider track element
 * @param {string} optionId - The option ID
 * @param {string} questionId - The question ID
 * @param {number} lanePosition - Vertical lane position in pixels
 */
function setupDragAndDrop(optionEl, sliderTrack, optionId, questionId, lanePosition) {
  let dragState = DRAG_STATE.idle;
  let startX, startLeft;
  
  // Add dragging state class for styling
  optionEl.classList.add('draggable');
  
  // Mouse events
  optionEl.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
  
  // Touch events
  optionEl.addEventListener('touchstart', startDrag);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', endDrag);
  
  function startDrag(e) {
    e.preventDefault();
    
    // Get current position
    dragState = DRAG_STATE.dragging;
    optionEl.classList.add('dragging');
    
    // Store initial positions
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startLeft = optionEl.offsetLeft;
    
    // Bring to front
    optionEl.style.zIndex = '10';
    
    // Show tooltip during drag
    const tooltip = optionEl.querySelector('.option-tooltip');
    if (tooltip) tooltip.classList.add('visible');
  }
  
  function onDrag(e) {
    if (dragState !== DRAG_STATE.dragging) return;
    
    e.preventDefault();
    
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startX;
    
    const sliderWidth = sliderTrack.offsetWidth;
    const newLeft = Math.max(0, Math.min(sliderWidth, startLeft + deltaX));
    const newPosition = (newLeft / sliderWidth) * 100;
    
    // Update position while maintaining vertical lane position
    positionOptionElement(optionEl, newPosition, lanePosition);
    
    // Find and highlight current zone if in discrete mode
    if (sliderTrack.dataset.mode === 'discrete') {
      highlightCurrentZone(optionEl, sliderTrack);
    }
  }
  
  function endDrag(e) {
    if (dragState !== DRAG_STATE.dragging) return;
    
    dragState = DRAG_STATE.idle;
    optionEl.classList.remove('dragging');
    optionEl.style.zIndex = '';
    
    // Hide tooltip
    const tooltip = optionEl.querySelector('.option-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
    
    // If in discrete mode, snap to zone while maintaining lane position
    if (sliderTrack.dataset.mode === 'discrete') {
      snapToZone(optionEl, sliderTrack, lanePosition);
    }
    
    // Get all current option positions
    const allOptions = sliderTrack.querySelectorAll('.slider-option');
    const positions = {};
    
    allOptions.forEach(option => {
      const id = option.dataset.optionId;
      const position = parseFloat(option.dataset.position);
      positions[id] = position;
    });
    
    // Save response
    const commentField = document.getElementById(`comment-${questionId}`);
    const commentValue = commentField ? commentField.value : null;
    surveyData.saveResponse(questionId, positions, commentValue);
  }
}

/**
 * Highlight the zone that an option is currently over
 * @param {HTMLElement} optionEl - The option element
 * @param {HTMLElement} sliderTrack - The slider track element
 */
function highlightCurrentZone(optionEl, sliderTrack) {
  const position = parseFloat(optionEl.dataset.position);
  const zones = sliderTrack.querySelectorAll('.slider-zone');
  
  // Remove highlight from all zones
  zones.forEach(zone => zone.classList.remove('highlight'));
  
  // Find the zone the option is over
  zones.forEach(zone => {
    const start = parseFloat(zone.style.left);
    const width = parseFloat(zone.style.width);
    const end = start + width;
    
    if (position >= start && position <= end) {
      zone.classList.add('highlight');
    }
  });
}

/**
 * Snap an option to the nearest zone center
 * @param {HTMLElement} optionEl - The option element
 * @param {HTMLElement} sliderTrack - The slider track element
 * @param {number} lanePosition - The vertical lane position to maintain
 */
function snapToZone(optionEl, sliderTrack, lanePosition) {
  const position = parseFloat(optionEl.dataset.position);
  const currentOptionId = optionEl.dataset.optionId;
  const zones = sliderTrack.querySelectorAll('.slider-zone');
  let bestZone = null;
  let bestDistance = Infinity;
  
  // Find the closest zone
  zones.forEach(zone => {
    const start = parseFloat(zone.style.left);
    const width = parseFloat(zone.style.width);
    const end = start + width;
    const center = start + (width / 2);
    
    if (position >= start && position <= end) {
      // If within zone, snap to center
      bestZone = zone;
      bestDistance = 0;
    } else {
      // Calculate distance to zone center
      const distance = Math.abs(position - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestZone = zone;
      }
    }
  });
  
  // Snap to best zone center
  if (bestZone) {
    const start = parseFloat(bestZone.style.left);
    const width = parseFloat(bestZone.style.width);
    const center = start + (width / 2);
    const zoneId = bestZone.dataset.zoneId;
    
    // Simply maintain the lane position when snapping
    // Since each option has its dedicated lane, we don't need to check for overlaps
    positionOptionElement(optionEl, center, lanePosition);
    
    // Highlight the zone
    zones.forEach(zone => zone.classList.remove('highlight'));
    bestZone.classList.add('highlight');
  }
}

/**
 * Find options that overlap with a specified horizontal position
 * @param {HTMLElement} sliderTrack - The slider track element
 * @param {number} position - The horizontal position to check (0-100)
 * @param {string} excludeOptionId - Option ID to exclude from the check
 * @returns {Array} - Array of overlapping option elements
 */
function findOverlappingOptions(sliderTrack, position, excludeOptionId) {
  const allOptions = sliderTrack.querySelectorAll('.slider-option');
  const threshold = 5; // % distance to consider as overlapping
  const overlapping = [];
  
  allOptions.forEach(option => {
    // Skip the option we're currently moving
    if (option.dataset.optionId === excludeOptionId) return;
    
    const optionPosition = parseFloat(option.dataset.position);
    
    // Check if positions are close enough to be considered overlapping
    if (Math.abs(optionPosition - position) <= threshold) {
      overlapping.push(option);
    }
  });
  
  return overlapping;
}

/**
 * Get current positions of all options
 * @param {Object} optionsData - The options data object
 * @returns {Object} - Map of option IDs to positions
 */
function getCurrentPositions(optionsData) {
  const positions = {};
  
  Object.keys(optionsData).forEach(optionId => {
    const option = optionsData[optionId];
    const position = parseFloat(option.element.dataset.position);
    positions[optionId] = position;
  });
  
  return positions;
}

/**
 * Calculate vertical positions for options to prevent overlapping
 * @param {Array} sortedOptions - Options sorted by horizontal position
 * @returns {Object} - Map of option IDs to vertical offset values
 */
function calculateVerticalPositions(sortedOptions) {
  const positions = {};
  const proximityThreshold = 15; // % distance below which options are considered overlapping
  const rowHeight = 45; // Height in pixels between vertical positions
  
  // Track the position 'bands' - options that are close to each other
  const bands = [];
  
  // Process each option
  sortedOptions.forEach(option => {
    const currentPos = option.defaultPosition ?? 0;
    let bandIndex = -1;
    
    // Check if this option belongs to an existing band
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      
      // If any option in this band is close to the current option
      const isClose = band.some(bandOption => {
        const bandOptionPos = bandOption.defaultPosition ?? 0;
        return Math.abs(currentPos - bandOptionPos) < proximityThreshold;
      });
      
      if (isClose) {
        bandIndex = i;
        break;
      }
    }
    
    if (bandIndex === -1) {
      // Create a new band with this option
      bands.push([option]);
    } else {
      // Add to existing band
      bands[bandIndex].push(option);
    }
  });
  
  // Assign vertical positions based on bands
  bands.forEach(band => {
    if (band.length === 1) {
      // Single option in band - no offset needed
      positions[band[0].id] = 0;
    } else {
      // Multiple options in band - assign alternating positions
      band.forEach((option, index) => {
        // Calculate vertical offset based on position in the band
        // Using a staggered pattern
        let offset;
        if (band.length === 2) {
          // With 2 options, place one above and one below
          offset = index === 0 ? -rowHeight : rowHeight;
        } else {
          // With 3+ options, stagger them more
          const middle = Math.floor(band.length / 2);
          const relativePos = index - middle;
          offset = relativePos * rowHeight;
        }
        
        positions[option.id] = offset;
      });
    }
  });
  
  return positions;
}
