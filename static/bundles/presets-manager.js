class PresetsManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    
    // Create shared stylesheet for chip actions
    if (!window.sharedChipStyles) {
      window.sharedChipStyles = new CSSStyleSheet();
      window.sharedChipStyles.replaceSync(`
        /* Chip styles to override Materialize */
        .chip-action {
          background: #fff !important;
          color: #000 !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18) !important;
          font-weight: 600 !important;
          border: none !important;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 32px !important;
          line-height: 32px !important;
          padding: 0 16px !important;
          border-radius: 16px !important;
          text-transform: none !important;
          text-decoration: none !important;
          vertical-align: middle !important;
        }
        .chip-action:hover {
          background: #f2f2f2 !important;
          color: #222 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.28) !important;
          transform: translateY(-2px) scale(1.04);
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          z-index: 1000 !important;
          display: none !important;
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
        }
        
        .modal-overlay.active {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          opacity: 1 !important;
        }
        
        /* Backup inline style approach for modal */
        #add-preset-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        #add-preset-modal.active {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
        }
        
        .modal {
          background: white !important;
          border-radius: 4px !important;
          box-shadow: 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2) !important;
          max-width: 600px !important;
          width: 90% !important;
          max-height: 80% !important;
          overflow-y: auto !important;
          transform: scale(0.7) !important;
          transition: transform 0.3s ease !important;
        }
        
        .modal-overlay.active .modal {
          transform: scale(1) !important;
        }
        
        .modal-content {
          padding: 24px !important;
        }
        
        .modal-header {
          padding-bottom: 20px !important;
          border-bottom: 1px solid #e0e0e0 !important;
          margin-bottom: 24px !important;
        }
        
        .modal-title {
          margin: 0 !important;
          font-size: 1.5rem !important;
          font-weight: 400 !important;
          color: rgba(0,0,0,0.87) !important;
        }
        
        .modal-footer {
          padding-top: 20px !important;
          border-top: 1px solid #e0e0e0 !important;
          margin-top: 24px !important;
          display: flex !important;
          justify-content: flex-end !important;
          gap: 12px !important;
        }
        
        .modal-close-btn {
          background: transparent !important;
          border: none !important;
          color: #26a69a !important;
          cursor: pointer !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          padding: 8px 16px !important;
          text-transform: uppercase !important;
          transition: background-color 0.2s !important;
          border-radius: 4px !important;
        }
        
        .modal-close-btn:hover {
          background-color: rgba(38, 166, 154, 0.08) !important;
        }

        /* Custom Select Component - Ultra specific overrides for Materialize */
        .select-wrapper {
          position: relative !important;
        }
        
        .select-wrapper input.select-dropdown {
          position: relative !important;
          cursor: pointer !important;
          background-color: transparent !important;
          border: none !important;
          border-bottom: 1px solid #9e9e9e !important;
          outline: none !important;
          height: 3rem !important;
          line-height: 3rem !important;
          width: 100% !important;
          font-size: 16px !important;
          margin: 0 0 8px 0 !important;
          padding: 0 !important;
          display: block !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          z-index: 1 !important;
        }
        
        .select-wrapper input.select-dropdown:focus {
          border-bottom: 1px solid #26a69a !important;
          box-shadow: 0 1px 0 0 #26a69a !important;
        }
        
        .select-wrapper .caret {
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          height: 10px !important;
          margin: auto 0 !important;
          font-size: 10px !important;
          line-height: 10px !important;
          color: initial !important;
          transform: rotate(0deg) !important;
          transition: transform 0.3s !important;
        }
        
        .select-wrapper.active .caret {
          transform: rotate(180deg) !important;
        }
        
        .dropdown-content {
          background-color: #fff !important;
          margin: 0 !important;
          display: block !important;
          min-width: 100px !important;
          overflow-y: auto !important;
          opacity: 0 !important;
          visibility: hidden !important;
          position: absolute !important;
          left: 0 !important;
          top: calc(100% + 2px) !important;
          z-index: 9999 !important;
          transform-origin: 0 0 !important;
          border-radius: 2px !important;
          box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12) !important;
          width: 100% !important;
          transition: opacity 0.3s ease, visibility 0.3s ease !important;
          max-height: 200px !important;
          box-sizing: border-box !important;
        }
        
        .dropdown-content.active {
          opacity: 1 !important;
          visibility: visible !important;
          background-color: #fff !important;
          border: 2px solid #26a69a !important;
          display: block !important;
        }
        
        ul.dropdown-content,
        ul#category-dropdown {
          background-color: #fff !important;
          margin: 0 !important;
          display: block !important;
          min-width: 100px !important;
          overflow-y: auto !important;
          opacity: 0 !important;
          visibility: hidden !important;
          position: absolute !important;
          left: 0 !important;
          top: calc(100% + 2px) !important;
          z-index: 9999 !important;
          transform-origin: 0 0 !important;
          border-radius: 2px !important;
          box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12) !important;
          width: 100% !important;
          transition: opacity 0.3s ease, visibility 0.3s ease !important;
          max-height: 200px !important;
          box-sizing: border-box !important;
        }
        
        ul.dropdown-content.active,
        ul#category-dropdown.active {
          opacity: 1 !important;
          visibility: visible !important;
          background-color: #fff !important;
          border: 2px solid #26a69a !important;
          display: block !important;
        }
        
        .dropdown-content li {
          clear: both;
          color: rgba(0,0,0,0.87);
          cursor: pointer;
          min-height: 50px;
          line-height: 1.5rem;
          width: 100%;
          text-align: left;
          text-transform: none;
          list-style-type: none;
        }
        
        .dropdown-content li:hover {
          background-color: #eee;
        }
        
        .dropdown-content li.active {
          background-color: #eee;
        }
        
        .dropdown-content li.selected {
          background-color: rgba(0,0,0,0.03);
        }
        
        .dropdown-content li > a, .dropdown-content li > span {
          font-size: 16px;
          color: #26a69a;
          display: block;
          line-height: 22px;
          padding: 14px 16px;
        }
        
        .dropdown-content li > span {
          color: rgba(0,0,0,0.87);
        }
      `);
    }
    
    // Use constructed stylesheet for custom styles
    this.shadowRoot.adoptedStyleSheets = [window.sharedChipStyles];
    
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      <div class="container">
        <h1>Manage Recurring Budget Presets</h1>
        <p>These presets will be automatically applied when creating budgets for new months.</p>
        
        <div class="divider" style="margin: 2em 0;"></div>

        <div class="row" style="margin-bottom: 0;">
          <div class="col s6">
            <h2 style="margin: 0; line-height: 32px;">Current Presets</h2>
          </div>
          <div class="col s6" style="text-align: right;">
            <button id="add-preset-btn" class="chip chip-action">
              <i class="material-icons left">add</i>
              Add New Preset
            </button>
          </div>
        </div>
        <div id="presets-list">
          <div id="loading" style="text-align: center; margin: 2em;">
            <div class="preloader-wrapper small active">
              <div class="spinner-layer spinner-blue-only">
                <div class="circle-clipper left">
                  <div class="circle"></div>
                </div>
                <div class="gap-patch">
                  <div class="circle"></div>
                </div>
                <div class="circle-clipper right">
                  <div class="circle"></div>
                </div>
              </div>
            </div>
            <p>Loading presets...</p>
          </div>
        </div>
      </div>`;
    
    // Create modal outside Shadow DOM for proper positioning
    this.createModalInDocument();
  }
  
  createModalInDocument() {
    // Remove any existing modal
    const existingModal = document.getElementById('add-preset-modal-global');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal in main document
    const modalHtml = `
      <div id="add-preset-modal-global" class="modal-overlay-global" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        align-items: center;
        justify-content: center;
      ">
        <div class="modal-global" style="
          background: white;
          border-radius: 4px;
          box-shadow: 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2);
          max-width: 600px;
          width: 90%;
          height: calc(100vh - 120px);
          margin: 60px 0;
          overflow-y: auto;
          transform: scale(0.7);
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
        ">
          <div style="padding: 24px; flex: 1; display: flex; flex-direction: column;">
            <div style="padding-bottom: 20px; border-bottom: 1px solid #e0e0e0; margin-bottom: 24px; position: relative;">
              <h2 style="margin: 0; font-size: 1.5rem; font-weight: 400; color: rgba(0,0,0,0.87); padding-right: 40px;">Add New Preset</h2>
              <button type="button" id="modal-close-btn-icon" style="
                position: absolute;
                top: 0;
                right: 0;
                background: transparent;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 24px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s, color 0.2s;
              " onmouseover="this.style.backgroundColor='rgba(0,0,0,0.08)'; this.style.color='#000';" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#666';">
                <i class="material-icons">close</i>
              </button>
            </div>
            
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            
            <form id="add-preset-form-modal" style="flex: 1; display: flex; flex-direction: column;">
              <div class="row">
                <div class="input-field col s12 m4">
                  <select id="category-modal" required>
                    <option value="" disabled selected>Choose category</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Home">Home</option>
                    <option value="Earnings">Earnings</option>
                  </select>
                  <label for="category-modal">Category</label>
                </div>
                <div class="input-field col s12 m4">
                  <input id="subcategory-modal" type="text" required>
                  <label for="subcategory-modal">Subcategory</label>
                </div>
                <div class="input-field col s12 m4">
                  <input id="amount-modal" type="number" step="0.01" min="0" required>
                  <label for="amount-modal">Default Amount</label>
                </div>
              </div>
            </form>
            
            <div style="padding-top: 20px; border-top: 1px solid #e0e0e0; margin-top: auto; display: flex; justify-content: flex-end; gap: 12px;">
              <button type="button" id="modal-cancel-btn-global" style="
                background: transparent;
                border: none;
                color: #26a69a;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                padding: 8px 16px;
                text-transform: uppercase;
                transition: background-color 0.2s;
                border-radius: 4px;
              ">Cancel</button>
              <button type="submit" form="add-preset-form-modal" id="modal-submit-btn-global" style="
                background: #fff;
                color: #000;
                box-shadow: 0 2px 6px rgba(0,0,0,0.18);
                font-weight: 600;
                border: none;
                transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 32px;
                line-height: 32px;
                padding: 0 16px;
                border-radius: 16px;
                text-transform: none;
                text-decoration: none;
              ">Add Preset</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Initialize Materialize select in the modal
    setTimeout(() => {
      const selectElement = document.getElementById('category-modal');
      if (selectElement && window.M) {
        window.M.FormSelect.init(selectElement);
      }
    }, 100);
  }

  connectedCallback() {
    this.loadPresets();
    this.setupEventListeners();
    
    // Initialize components with a longer delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeMaterializeComponents();
      this.setupModalEventListeners(); // Setup modal listeners after DOM is ready
    }, 500);
  }

  initializeMaterializeComponents() {
    console.log('Initializing Materialize-style select...');
    
    // Setup Materialize-style select functionality
    const selectInput = this.shadowRoot.getElementById('category');
    const dropdown = this.shadowRoot.getElementById('category-dropdown');
    const selectWrapper = selectInput?.closest('.select-wrapper');
    const label = selectInput?.nextElementSibling?.nextElementSibling; // Skip the caret icon
    const caret = selectWrapper?.querySelector('.caret');
    
    if (!selectInput || !dropdown || !selectWrapper) {
      console.error('Could not find required select elements');
      return;
    }
    
    let isOpen = false;
    let selectedValue = '';
    
    // Open dropdown
    const openDropdown = () => {
      if (isOpen) return;
      
      console.log('Opening dropdown');
      isOpen = true;
      
      // Calculate and set exact width to match input
      const inputWidth = selectInput.offsetWidth;
      dropdown.style.width = inputWidth + 'px';
      
      // Show dropdown with CSS classes
      dropdown.classList.add('active');
      selectWrapper.classList.add('active');
      
      // Force display with inline styles as fallback
      dropdown.style.display = 'block';
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
      dropdown.style.zIndex = '9999';
      dropdown.style.position = 'absolute';
      dropdown.style.left = '0';
      dropdown.style.top = 'calc(100% + 2px)';
      
      // Focus first item
      const firstItem = dropdown.querySelector('li');
      if (firstItem) {
        firstItem.classList.add('active');
      }
      
      // Debug: Check computed styles
      const dropdownStyles = window.getComputedStyle(dropdown);
      console.log('Dropdown computed styles:', {
        display: dropdownStyles.display,
        opacity: dropdownStyles.opacity,
        visibility: dropdownStyles.visibility,
        position: dropdownStyles.position,
        top: dropdownStyles.top,
        left: dropdownStyles.left,
        width: dropdownStyles.width,
        zIndex: dropdownStyles.zIndex,
        background: dropdownStyles.backgroundColor
      });
      
      console.log('Dropdown classes:', dropdown.className);
      console.log('Dropdown should now be visible with width:', inputWidth + 'px');
    };
    
    // Close dropdown
    const closeDropdown = () => {
      if (!isOpen) return;
      
      console.log('Closing dropdown');
      isOpen = false;
      
      dropdown.classList.remove('active');
      selectWrapper.classList.remove('active');
      
      // Force hide with inline styles as fallback
      dropdown.style.display = 'block';
      dropdown.style.opacity = '0';
      dropdown.style.visibility = 'hidden';
      
      // Remove active states
      dropdown.querySelectorAll('li').forEach(item => {
        item.classList.remove('active');
      });
      
      console.log('Dropdown should now be hidden');
    };
    
    // Handle input click
    selectInput.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });
    
    // Handle option selection
    dropdown.addEventListener('click', (e) => {
      const span = e.target.closest('span');
      if (!span) return;
      
      const value = span.getAttribute('data-value');
      const text = span.textContent;
      
      console.log('Option selected:', value, text);
      
      // Clear previous selections
      dropdown.querySelectorAll('li').forEach(item => {
        item.classList.remove('selected');
      });
      
      // Set new selection
      span.parentElement.classList.add('selected');
      selectedValue = value;
      
      // Update input
      selectInput.value = text;
      selectInput.setAttribute('data-value', value);
      
      // Update label
      if (label) {
        label.classList.add('active');
      }
      
      closeDropdown();
      
      console.log('Selection complete:', value);
    });
    
    // Handle keyboard navigation
    selectInput.addEventListener('keydown', (e) => {
      const items = Array.from(dropdown.querySelectorAll('li'));
      const activeItem = dropdown.querySelector('li.active');
      const currentIndex = items.indexOf(activeItem);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            setActiveItem(items, nextIndex);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            setActiveItem(items, prevIndex);
          }
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && activeItem) {
            const span = activeItem.querySelector('span');
            if (span) {
              span.click();
            }
          } else {
            openDropdown();
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          if (isOpen) {
            closeDropdown();
          }
          break;
          
        case 'Tab':
          if (isOpen) {
            closeDropdown();
          }
          break;
      }
    });
    
    // Set active item helper
    const setActiveItem = (items, index) => {
      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('active');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('active');
        }
      });
    };
    
    // Handle hover
    dropdown.addEventListener('mouseover', (e) => {
      const li = e.target.closest('li');
      if (li) {
        const items = Array.from(dropdown.querySelectorAll('li'));
        const index = items.indexOf(li);
        setActiveItem(items, index);
      }
    });
    
    // Handle clicks outside to close
    document.addEventListener('click', (e) => {
      if (!selectWrapper.contains(e.target) && isOpen) {
        closeDropdown();
      }
    });
    
    console.log('Materialize-style select initialized successfully');

    // Initialize input labels for other fields
    const inputs = this.shadowRoot.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
      // Skip the category select input
      if (input.id === 'category') return;
      
      input.addEventListener('focus', () => {
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
          label.classList.add('active');
        }
      });
      
      input.addEventListener('blur', () => {
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL' && !input.value) {
          label.classList.remove('active');
        }
      });
    });
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('add-preset-form');
    if (!form) {
      console.error('Could not find add-preset-form');
      return;
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addPreset();
    });
  }
  
  setupModalEventListeners() {
    console.log('Setting up modal event listeners...');
    
    // Modal functionality - now targeting global modal
    const addPresetBtn = this.shadowRoot.getElementById('add-preset-btn');
    const modal = document.getElementById('add-preset-modal-global');
    const cancelBtn = document.getElementById('modal-cancel-btn-global');
    const closeIconBtn = document.getElementById('modal-close-btn-icon');
    const form = document.getElementById('add-preset-form-modal');
    
    console.log('Modal elements found:', {
      addPresetBtn: !!addPresetBtn,
      modal: !!modal,
      cancelBtn: !!cancelBtn,
      closeIconBtn: !!closeIconBtn,
      form: !!form
    });
    
    if (!addPresetBtn) {
      console.error('Could not find add-preset-btn');
      return;
    }
    
    if (!modal) {
      console.error('Could not find add-preset-modal-global');
      return;
    }
    
    if (!cancelBtn) {
      console.error('Could not find modal-cancel-btn-global');
      return;
    }
    
    // Open modal
    addPresetBtn.addEventListener('click', (e) => {
      console.log('Add preset button clicked');
      e.preventDefault();
      this.openModal();
    });
    
    // Close modal
    cancelBtn.addEventListener('click', () => {
      console.log('Cancel button clicked');
      this.closeModal();
    });
    
    // Close modal with icon button
    if (closeIconBtn) {
      closeIconBtn.addEventListener('click', () => {
        console.log('Close icon button clicked');
        this.closeModal();
      });
    }
    
    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Modal overlay clicked');
        this.closeModal();
      }
    });
    
    // Handle form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Modal form submitted');
        await this.addPresetFromModal();
      });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        console.log('Escape key pressed');
        this.closeModal();
      }
    });
    
    console.log('Modal event listeners setup complete');
  }
  
  openModal() {
    console.log('openModal called');
    const modal = document.getElementById('add-preset-modal-global');
    const modalContent = modal?.querySelector('.modal-global');
    
    if (!modal) {
      console.error('Could not find modal element in openModal');
      return;
    }
    
    console.log('Showing global modal');
    
    // Show modal
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    
    // Scale animation for modal content
    if (modalContent) {
      modalContent.style.transform = 'scale(1)';
    }
    
    console.log('Modal should now be visible');
    
    // Focus first input
    setTimeout(() => {
      const categorySelect = document.getElementById('category-modal');
      if (categorySelect) {
        categorySelect.focus();
      }
    }, 300);
  }
  
  closeModal() {
    console.log('closeModal called');
    const modal = document.getElementById('add-preset-modal-global');
    const modalContent = modal?.querySelector('.modal-global');
    
    if (!modal) {
      console.error('Could not find modal element in closeModal');
      return;
    }
    
    // Hide modal with animation
    modal.style.opacity = '0';
    if (modalContent) {
      modalContent.style.transform = 'scale(0.7)';
    }
    
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
    
    // Reset form
    this.resetModalForm();
  }
  
  resetModalForm() {
    const form = document.getElementById('add-preset-form-modal');
    if (form) {
      form.reset();
    }
    
    // Reset Materialize select
    const selectElement = document.getElementById('category-modal');
    if (selectElement && window.M) {
      const instance = window.M.FormSelect.getInstance(selectElement);
      if (instance) {
        instance.destroy();
        window.M.FormSelect.init(selectElement);
      }
    }
    
    // Reset labels
    const labels = document.querySelectorAll('#add-preset-modal-global label');
    labels.forEach(label => {
      if (label.htmlFor !== 'category-modal') {
        label.classList.remove('active');
      }
    });
  }
  
  resetForm() {
    const form = this.shadowRoot.getElementById('add-preset-form');
    form.reset();
    
    // Reset select with null checks
    const selectInput = this.shadowRoot.getElementById('category');
    const dropdown = this.shadowRoot.getElementById('category-dropdown');
    const label = selectInput?.nextElementSibling?.nextElementSibling;
    
    if (selectInput) {
      selectInput.value = '';
      selectInput.removeAttribute('data-value');
    }
    
    if (label) {
      label.classList.remove('active');
    }
    
    // Clear all selections with null check
    if (dropdown) {
      dropdown.querySelectorAll('li').forEach(item => {
        item.classList.remove('selected');
      });
    }
    
    // Reset other field labels
    this.shadowRoot.querySelectorAll('label').forEach(label => {
      if (label.getAttribute('for') !== 'category') {
        label.classList.remove('active');
      }
    });
  }

  async loadPresets() {
    try {
      const response = await fetch('/api/presets');
      const data = await response.json();
      
      const loadingElement = this.shadowRoot.getElementById('loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      this.renderPresets(data.presets);
    } catch (error) {
      console.error('Error loading presets:', error);
      const loadingElement = this.shadowRoot.getElementById('loading');
      if (loadingElement) {
        loadingElement.innerHTML = '<p style="color: red;">Error loading presets</p>';
      }
    }
  }

  renderPresets(presets) {
    const container = this.shadowRoot.getElementById('presets-list');
    
    if (!container) {
      console.error('Could not find presets-list container');
      return;
    }
    
    if (Object.keys(presets).length === 0) {
      container.innerHTML = '<p>No presets defined yet.</p>';
      return;
    }

    let tableHTML = `
      <table class="striped">
        <thead>
          <tr>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const [category, subcategories] of Object.entries(presets)) {
      for (const [subcategory, amount] of Object.entries(subcategories)) {
        tableHTML += `
          <tr>
            <td>${category}</td>
            <td>${subcategory}</td>
            <td>$${amount.toFixed(2)}</td>
            <td>
              <button class="chip chip-action remove-btn" 
                      data-category="${category}" 
                      data-subcategory="${subcategory}">
                Remove
              </button>
            </td>
          </tr>
        `;
      }
    }

    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;

    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const category = btn.getAttribute('data-category');
        const subcategory = btn.getAttribute('data-subcategory');
        
        if (confirm(`Remove preset for ${category} - ${subcategory}?`)) {
          await this.removePreset(category, subcategory);
        }
      });
    });
  }

  async addPresetFromModal() {
    const categorySelect = document.getElementById('category-modal');
    const subcategoryInput = document.getElementById('subcategory-modal');
    const amountInput = document.getElementById('amount-modal');
    
    const category = categorySelect?.value;
    const subcategory = subcategoryInput?.value?.trim();
    const amount = amountInput?.value;

    if (!category || !subcategory || !amount) {
      alert('Please fill in all fields');
      return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      const response = await fetch('/api/presets/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          subcategory,
          amount: parseFloat(amount)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Preset added successfully from modal');
        
        // Reload presets
        await this.loadPresets();
        
        // Close modal and reset form
        this.closeModal();
        
        // Show success message
        alert('Preset added successfully!');
      } else {
        alert('Error adding preset: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding preset:', error);
      alert('Error adding preset: ' + error.message);
    }
  }

  async addPreset() {
    const selectInput = this.shadowRoot.getElementById('category');
    const category = selectInput?.getAttribute('data-value');
    const subcategory = this.shadowRoot.getElementById('subcategory').value.trim();
    const amount = this.shadowRoot.getElementById('amount').value;

    if (!category || !subcategory || !amount) {
      alert('Please fill in all fields');
      return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      const response = await fetch('/api/presets/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          subcategory,
          amount: parseFloat(amount)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Preset added successfully, resetting form...');
        
        // Reload presets
        await this.loadPresets();
        
        // Close modal and reset form
        this.closeModal();
        
        // Show success message
        alert('Preset added successfully!');
      } else {
        alert('Error adding preset: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding preset:', error);
      alert('Error adding preset: ' + error.message);
    }
  }

  async removePreset(category, subcategory) {
    try {
      const response = await fetch('/api/presets/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          subcategory
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload presets
        await this.loadPresets();
      } else {
        alert('Error removing preset: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error removing preset:', error);
      alert('Error removing preset');
    }
  }
}
customElements.define('presets-manager', PresetsManager);
