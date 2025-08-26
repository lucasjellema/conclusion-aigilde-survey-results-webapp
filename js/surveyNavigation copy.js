/**
 * surveyNavigation.js
 * Survey navigation module
 * 
 * This module provides functions to navigate between survey steps,
 * handle step transitions, and track navigation state.
 */

import * as surveyData from './surveyData.js';
import { renderQuestionsForStep } from './questionRenderers.js';

// Constants for navigation buttons
const NAV_BUTTON_IDS = {
  next: 'survey-next-btn',
  prev: 'survey-prev-btn',
  submit: 'survey-submit-btn'
};

// Navigation state
const navState = {
  surveyContainer: null,
  questionsContainer: null,
  progressBar: null,
  navigationHandler: null,
  submitHandler: null
};

/**
 * Initialize the survey navigation
 * @param {HTMLElement} surveyContainer - The main survey container element
 * @param {HTMLElement} questionsContainer - The container for questions
 * @param {HTMLElement} progressBar - The progress bar element
 * @param {Function} submitHandler - Function to call when survey is submitted
 */
export function initNavigation(
  surveyContainer, 
  questionsContainer, 
  progressBar = null,
  submitHandler = null
) {
  navState.surveyContainer = surveyContainer;
  navState.questionsContainer = questionsContainer;
  navState.progressBar = progressBar;
  navState.submitHandler = submitHandler;
  
  // Create navigation controls
  createNavigationControls();
  
  // Load the first step
  loadCurrentStep();
}

/**
 * Create navigation buttons and controls
 */
function createNavigationControls() {
  // Create navigation container
  const navContainer = document.createElement('div');
  navContainer.className = 'survey-navigation';
  
  // Create previous button
  const prevButton = document.createElement('button');
  prevButton.id = NAV_BUTTON_IDS.prev;
  prevButton.className = 'survey-nav-button prev-button';
  prevButton.textContent = 'Previous';
  prevButton.addEventListener('click', handlePrevStep);
  navContainer.appendChild(prevButton);
  
  // Create next button
  const nextButton = document.createElement('button');
  nextButton.id = NAV_BUTTON_IDS.next;
  nextButton.className = 'survey-nav-button next-button';
  nextButton.textContent = 'Next';
  nextButton.addEventListener('click', handleNextStep);
  navContainer.appendChild(nextButton);
  
  // Create submit button (initially hidden)
  const submitButton = document.createElement('button');
  submitButton.id = NAV_BUTTON_IDS.submit;
  submitButton.className = 'survey-nav-button submit-button';
  submitButton.textContent = 'Submit Survey';
  submitButton.style.display = 'none';
  submitButton.addEventListener('click', handleSubmitSurvey);
  navContainer.appendChild(submitButton);
  
  // Add navigation container to survey container
  navState.surveyContainer.appendChild(navContainer);
}

/**
 * Get CSS value for background position
 * @param {string} position - Position value from survey definition
 * @returns {string} - CSS value for background-position
 */
function getBackgroundPosition(position) {
  // Default position is center
  if (!position) return 'center';
  
  // Return the position directly as it should be a valid CSS value
  // (center, top, bottom, left, right, or combinations)
  return position;
}

/**
 * Get CSS opacity value based on opacity keyword
 * @param {string} opacity - Opacity value from survey definition (light, medium, dark)
 * @returns {number} - CSS opacity value between 0 and 1
 */
function getBackgroundOpacity(opacity) {
  // Default opacity is medium (0.5)
  if (!opacity) return 0.5;
  
  // Map opacity keywords to values
  switch (opacity.toLowerCase()) {
    case 'light':
      return 0.2;
    case 'medium':
      return 0.5;
    case 'dark':
      return 0.8;
    default:
      // If it's a number between 0-1, use it directly
      const numValue = parseFloat(opacity);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
        return numValue;
      }
      return 0.5; // Default to medium opacity
  }
}

/**
 * Update navigation button states based on current step
 */
function updateNavigationButtons() {
  const prevButton = document.getElementById(NAV_BUTTON_IDS.prev);
  const nextButton = document.getElementById(NAV_BUTTON_IDS.next);
  const submitButton = document.getElementById(NAV_BUTTON_IDS.submit);
  
  if (!prevButton || !nextButton || !submitButton) {
    return;
  }
  
  // Check if we have previous/next steps
  const hasPrev = surveyData.hasPrevStep();
  const hasNext = surveyData.hasNextStep();
  
  // Update previous button
  prevButton.disabled = !hasPrev;
  
  // Update next/submit buttons
  if (hasNext) {
    nextButton.style.display = '';
    submitButton.style.display = 'none';
  } else {
    nextButton.style.display = 'none';
    submitButton.style.display = '';
  }
}

/**
 * Update progress bar if available
 */
function updateProgressBar() {
  if (!navState.progressBar) {
    return;
  }
  
  const steps = surveyData.getAllSteps();
  if (!steps || steps.length === 0) {
    return;
  }
  
  const currentIndex = surveyData.getCurrentStepIndex();
  const progress = ((currentIndex + 1) / steps.length) * 100;
  
  navState.progressBar.style.width = `${progress}%`;
  navState.progressBar.setAttribute('aria-valuenow', progress);
}

/**
 * Load and render the current step
 */
export function loadCurrentStep() {
  const currentStepIndex = surveyData.getCurrentStepIndex();
  const currentStep = surveyData.getCurrentStep();
  
  if (!currentStep) {
    console.error('No current step available');
    return;
  }
  
  // We already have the current step, so we can continue
  const step = currentStep;
  
  // Update progress bar
  updateProgressBar();
  
  // Get the existing questions container from the DOM
  const questionsContainer = document.getElementById('survey-questions-container');
  if (!questionsContainer) {
    console.error('Survey questions container not found');
    return;
  }
  
  // Clear previous questions
  questionsContainer.innerHTML = '';
  
  // Create a step container inside the questions container
  const stepContainer = document.createElement('div');
  stepContainer.id = 'survey-step-container';
  stepContainer.className = 'survey-step';
  questionsContainer.appendChild(stepContainer);
  
  // Create step title element
  if (step.title) {
    const stepTitle = document.createElement('h2');
    stepTitle.className = 'step-title';
    stepTitle.textContent = step.title;
    stepContainer.appendChild(stepTitle);
  }
  
  if (step.description) {
    const stepDescription = document.createElement('p');
    stepDescription.className = 'step-description';
    stepDescription.textContent = step.description;
    stepContainer.appendChild(stepDescription);
  }
  
  // Create questions inner container
  const questionsInnerContainer = document.createElement('div');
  questionsInnerContainer.className = 'questions-inner-container';
  stepContainer.appendChild(questionsInnerContainer);
  
  // Check if the step has a background image
  if (step.backgroundImage && step.backgroundImage.url) {
    // Create a unique ID for this step's style
    const styleId = `step-${step.id}-style`;
    
    // Remove any existing style for this step
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create a new style element
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    
    // Set the CSS for the background image - use class selector for better targeting
    let css = `
      #survey-questions-container .survey-step {
        position: relative;
        overflow: hidden;
      }
      
      #survey-questions-container .survey-step::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${step.backgroundImage.url}');
        background-size: cover;
        background-position: ${getBackgroundPosition(step.backgroundImage.position)};
        opacity: ${getBackgroundOpacity(step.backgroundImage.opacity)};
        z-index: -1;
      }
    `;
    
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    // Add classes for opacity and position if specified
    if (step.backgroundImage.opacity) {
      stepContainer.classList.add(`bg-opacity-${step.backgroundImage.opacity}`);
    }
    
    if (step.backgroundImage.position) {
      stepContainer.classList.add(`bg-position-${step.backgroundImage.position}`);
    }
    
    // Add wrapper for content to ensure proper z-index layering
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'survey-step-content';
    questionsInnerContainer.appendChild(contentWrapper);
    
    // Render questions directly from original step object
    // Log for debugging
    console.log('Rendering questions for step with background:', step);
    renderQuestionsForStep(step, contentWrapper);
  } else {
    // No background image, render directly into questions container
    console.log('Rendering questions for step without background:', step);
    renderQuestionsForStep(step, questionsInnerContainer);
  }
  
  // Update navigation buttons
  updateNavigationButtons();
  
  // Update progress bar
  updateProgressBar();
}

/**
 * Validate the current step before proceeding
 * @returns {boolean} - Whether the step is valid
 */
function validateCurrentStep() {
  const currentStep = surveyData.getCurrentStep();
  
  if (!currentStep || !currentStep.questions) {
    return true;
  }
  
  // Find required questions
  const requiredQuestions = currentStep.questions.filter(q => q.required);
  
  // Check if all required questions have responses
  for (const question of requiredQuestions) {
    const response = surveyData.getResponse(question.id);
    
    if (!response || response.value === undefined || response.value === null || 
        (Array.isArray(response.value) && response.value.length === 0) ||
        (typeof response.value === 'string' && response.value.trim() === '')) {
      
      // Show error for this question
      const questionEl = document.getElementById(`question-${question.id}`);
      if (questionEl) {
        questionEl.classList.add('validation-error');
        
        // Create or update error message
        let errorMsg = questionEl.querySelector('.validation-error-message');
        if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'validation-error-message';
          questionEl.appendChild(errorMsg);
        }
        errorMsg.textContent = 'This question is required';
      }
      
      return false;
    }
  }
  
  return true;
}

/**
 * Clear validation errors on the current step
 */
function clearValidationErrors() {
  // Remove all validation error classes and messages
  const errorElements = navState.questionsContainer.querySelectorAll('.validation-error');
  errorElements.forEach(element => {
    element.classList.remove('validation-error');
    
    const errorMsg = element.querySelector('.validation-error-message');
    if (errorMsg) {
      errorMsg.remove();
    }
  });
}

/**
 * Handle next button click
 */
function handleNextStep() {
  // Validate current step
  if (!validateCurrentStep()) {
    // Scroll to the first error
    const firstError = navState.questionsContainer.querySelector('.validation-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Clear validation errors
  clearValidationErrors();
  
  // Move to next step
  if (surveyData.nextStep()) {
    loadCurrentStep();
    
    // Scroll to top of questions
    navState.questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Handle previous button click
 */
function handlePrevStep() {
  // Clear validation errors
  clearValidationErrors();
  
  // Move to previous step
  if (surveyData.prevStep()) {
    loadCurrentStep();
    
    // Scroll to top of questions
    navState.questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Handle submit button click
 */
async function handleSubmitSurvey() {
  // Validate current step
  if (!validateCurrentStep()) {
    // Scroll to the first error
    const firstError = navState.questionsContainer.querySelector('.validation-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  try {
    // Disable submit button to prevent multiple submissions
    const submitButton = document.getElementById(NAV_BUTTON_IDS.submit);
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }
    
    // Submit survey data
    const result = await surveyData.submitSurvey();
    
    // Call submit handler if provided
    if (navState.submitHandler && typeof navState.submitHandler === 'function') {
      navState.submitHandler(result);
    } else {
      // Default success message
      showSubmitSuccess();
    }
  } catch (error) {
    console.error('Error submitting survey:', error);
    
    // Show error message
    showSubmitError(error.message || 'Failed to submit survey');
    
    // Re-enable submit button
    const submitButton = document.getElementById(NAV_BUTTON_IDS.submit);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Survey';
    }
  }
}

/**
 * Show a success message after survey submission
 */
function showSubmitSuccess() {
  // Hide questions and navigation
  navState.questionsContainer.style.display = 'none';
  const navButtons = navState.surveyContainer.querySelector('.survey-navigation');
  if (navButtons) {
    navButtons.style.display = 'none';
  }
  
  // Create success message
  const successMessage = document.createElement('div');
  successMessage.className = 'survey-submit-success';
  
  const heading = document.createElement('h2');
  heading.textContent = 'Thank You!';
  
  const message = document.createElement('p');
  message.textContent = 'Your survey responses have been successfully submitted.';
  
  successMessage.appendChild(heading);
  successMessage.appendChild(message);
  
  // Append to survey container
  navState.surveyContainer.appendChild(successMessage);
}

/**
 * Show an error message if survey submission fails
 * @param {string} errorMessage - The error message to display
 */
function showSubmitError(errorMessage) {
  // Create or update error message
  let errorContainer = navState.surveyContainer.querySelector('.survey-submit-error');
  
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'survey-submit-error';
    navState.surveyContainer.appendChild(errorContainer);
  }
  
  errorContainer.textContent = `Error: ${errorMessage}`;
  
  // Scroll to error message
  errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
