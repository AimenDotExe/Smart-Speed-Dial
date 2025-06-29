// Load gradient, font size, grid columns, and search visibility early and apply
chrome.storage.sync.get(['gradient', 'fontSize', 'gridColumns', 'showSearch'], data => {
  if (data.gradient) {
    const [c1, c2] = data.gradient.split(',');
    const bg = `radial-gradient(ellipse at bottom, #${c1.trim()}, #${c2.trim()})`;
    document.body.style.background = bg;
    console.log("Applied saved gradient:", bg);
  } else {
    // Apply default gradient if none saved
    const defaultBg = `radial-gradient(ellipse at bottom, #0d0d2b, #000)`;
    document.body.style.background = defaultBg;
  }
  
  // Set grid columns
  const gridColumns = data.gridColumns || 7;
  document.documentElement.style.setProperty('--grid-columns', gridColumns);
  
  // Apply combined font size
  const baseFontSize = data.fontSize || 100;
  applyCombinedFontSize(baseFontSize, gridColumns);
  
  // Show/hide search bar
  const searchContainer = document.getElementById('searchContainer');
  if (data.showSearch) {
    searchContainer.style.display = 'block';
  }
});

const dialGrid = document.getElementById('dialGrid');
const cardTemplate = document.getElementById('card-template');
const addTemplate = document.getElementById('add-template');
const folderTemplate = document.getElementById('folder-item-template');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

let sites = [];
let editingIndex = -1;
let draggedElement = null;
let draggedIndex = -1;
let isDragging = false;
let dropZones = [];
let currentDropZone = -1;

function applyCombinedFontSize(baseFontSize = 100, gridColumns = 7) {
  // Determine column multiplier based on grid columns
  let columnMultiplier = 1.0; // Default for 7 columns
  if (gridColumns === 5) {
    columnMultiplier = 1.4;
  } else if (gridColumns === 6) {
    columnMultiplier = 1.2;
  } else if (gridColumns === 7) {
    columnMultiplier = 1.0;
  } else if (gridColumns === 8) {
    columnMultiplier = 0.85;
  } else if (gridColumns === 9) {
    columnMultiplier = 0.75;
  }
  
  // Calculate final font size
  const finalFontSize = baseFontSize * columnMultiplier;
  
  // Apply to document
  document.documentElement.style.fontSize = `${finalFontSize}%`;
  
  console.log(`Applied combined font size: ${finalFontSize}% (base: ${baseFontSize}%, columns: ${gridColumns}, multiplier: ${columnMultiplier})`);
}

function saveSites() {
  localStorage.setItem('customSites', JSON.stringify(sites));
}

function loadSites() {
  const saved = localStorage.getItem('customSites');
  if (saved) {
    sites = JSON.parse(saved);
  }
}

function getInitials(name) {
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return null;
  }
}

// Web search functionality
function performWebSearch(query) {
  if (!query.trim()) return;
  
  // Use Google search as default
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(searchUrl, '_blank');
}

// Auto-focus search functionality
function handleGlobalKeydown(e) {
  // Only handle escape key for closing popups
  if (e.key === 'Escape') {
    closeAllPopups();
    return;
  }
  
  // Don't handle other keys if typing in input fields or if popups are open
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return;
  }
  
  // Check if any popup is open
  const popups = ['popup', 'editPopup', 'settingsPopup', 'bookmarkFolderPopup'];
  const isPopupOpen = popups.some(id => {
    const popup = document.getElementById(id);
    return popup && popup.style.display !== 'none';
  });
  
  if (isPopupOpen) return;
  
  // Check if search is enabled and visible
  const searchContainer = document.getElementById('searchContainer');
  if (searchContainer.style.display === 'none') return;
  
  // Auto-focus search for any printable character
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    searchInput.focus();
    searchInput.value = e.key;
    updateSearchClear();
  }
}

function updateSearchClear() {
  if (searchInput.value.trim()) {
    searchClear.style.display = 'flex';
  } else {
    searchClear.style.display = 'none';
  }
}

// Search event listeners
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    performWebSearch(searchInput.value);
  }
});

searchInput.addEventListener('input', updateSearchClear);

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  updateSearchClear();
  searchInput.focus();
});

// Global keydown listener
document.addEventListener('keydown', handleGlobalKeydown);

function showPopup(index = -1) {
  const popup = document.getElementById('popup');
  const nameInput = document.getElementById('siteName');
  const urlInput = document.getElementById('siteURL');
  const colorInput = document.getElementById('siteColor');
  const addBtn = document.getElementById('popupAdd');
  
  editingIndex = index;
  
  if (index >= 0 && sites[index]) {
    nameInput.value = sites[index].name;
    urlInput.value = sites[index].url;
    colorInput.value = sites[index].color || '#667eea';
    addBtn.textContent = 'Update Site';
  } else {
    nameInput.value = '';
    urlInput.value = '';
    colorInput.value = '#667eea';
    addBtn.textContent = 'Add Site';
  }
  
  popup.style.display = 'flex';

  addBtn.onclick = () => {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const color = colorInput.value;
    
    if (!name || !url) return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const siteData = { name, url, color };

    if (editingIndex >= 0) {
      sites[editingIndex] = siteData;
    } else {
      sites.push(siteData);
    }
    
    saveSites();
    closeAllPopups();
    render();
  };

  chrome.storage.sync.get(['useSuggestions'], result => {
    const suggestionsSection = document.getElementById('suggestionsSection');
    if (result.useSuggestions ?? true) {
      suggestionsSection.style.display = 'block';
      // Keep suggestions collapsed by default
      document.getElementById('suggestions').style.display = 'none';
      document.querySelector('.suggestions-icon').textContent = '+';
      document.getElementById('suggestionsToggle').classList.remove('expanded');
    } else {
      suggestionsSection.style.display = 'none';
    }
  });
}

function renderSuggestions() {
  const container = document.getElementById('suggestions');
  container.innerHTML = '';
  chrome.history.search({ text: '', maxResults: 5, startTime: 0 }, function(results) {
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerHTML = `
        <div class="suggestion-title">${item.title || 'Untitled'}</div>
        <div class="suggestion-url">${item.url}</div>
      `;
      div.onclick = () => {
        document.getElementById('siteName').value = item.title || item.url;
        document.getElementById('siteURL').value = item.url;
      };
      container.appendChild(div);
    });
  });
}

function calculateDropZones() {
  if (!dialGrid) return;
  
  const gridRect = dialGrid.getBoundingClientRect();
  const gridStyles = window.getComputedStyle(dialGrid);
  const gap = parseInt(gridStyles.gap) || 12;
  
  // Get actual number of columns from computed style
  const gridCols = gridStyles.gridTemplateColumns.split(' ').length;
  const cardWidth = (gridRect.width - (gap * (gridCols - 1))) / gridCols;
  const cardHeight = 60; // Fixed card height
  
  dropZones = [];
  
  // Create drop zones for each position including after the last card
  for (let i = 0; i <= sites.length; i++) {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    
    const x = col * (cardWidth + gap);
    const y = row * (cardHeight + gap);
    
    dropZones.push({
      index: i,
      x: x,
      y: y,
      width: cardWidth,
      height: cardHeight,
      centerX: x + cardWidth / 2,
      centerY: y + cardHeight / 2
    });
  }
}

function getClosestDropZone(mouseX, mouseY) {
  if (!dialGrid || dropZones.length === 0) return 0;
  
  const gridRect = dialGrid.getBoundingClientRect();
  const relativeX = mouseX - gridRect.left;
  const relativeY = mouseY - gridRect.top;
  
  let closestZone = 0;
  let minDistance = Infinity;
  
  dropZones.forEach((zone, index) => {
    // Skip the dragged item's original position
    if (index === draggedIndex) return;
    
    const distance = Math.sqrt(
      Math.pow(relativeX - zone.centerX, 2) + 
      Math.pow(relativeY - zone.centerY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestZone = index;
    }
  });
  
  return closestZone;
}

function updateCardPositions(targetIndex) {
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  const cards = dialGrid.querySelectorAll('.card:not(.add-card):not(.dragging)');
  
  cards.forEach((card, visualIndex) => {
    const originalIndex = parseInt(card.dataset.originalIndex);
    if (isNaN(originalIndex)) return;
    
    let newPosition = originalIndex;
    
    // Calculate where this card should move
    if (targetIndex <= originalIndex && originalIndex < draggedIndex) {
      // Cards between target and dragged item shift right
      newPosition = originalIndex + 1;
    } else if (targetIndex > originalIndex && originalIndex >= draggedIndex) {
      // Cards after dragged item shift left when target is to the right
      newPosition = originalIndex - 1;
    } else if (targetIndex > draggedIndex && originalIndex >= targetIndex) {
      // Cards at and after target shift right when dragging from left
      newPosition = originalIndex + 1;
    } else if (targetIndex < draggedIndex && originalIndex < targetIndex) {
      // Cards before target shift left when dragging from right
      newPosition = originalIndex - 1;
    }
    
    // Apply simple horizontal displacement only
    const positionDiff = newPosition - originalIndex;
    if (positionDiff !== 0) {
      const gridCols = window.getComputedStyle(dialGrid).gridTemplateColumns.split(' ').length;
      const translateX = (positionDiff % gridCols) * 100;
      
      card.style.transform = `translateX(${translateX}%)`;
      card.classList.add('displaced');
    } else {
      card.style.transform = '';
      card.classList.remove('displaced');
    }
  });
}

function render() {
  if (!dialGrid) return;
  
  dialGrid.innerHTML = '';
  
  sites.forEach((site, index) => {
    renderSiteCard(site, index);
  });

  // Add card
  const addCard = addTemplate.content.cloneNode(true);
  const addCardElement = addCard.querySelector('.add-card');
  if (addCardElement) {
    addCardElement.onclick = (e) => {
      e.stopPropagation();
      showPopup();
    };
  }
  dialGrid.appendChild(addCard);
}

function renderSiteCard(site, index) {
  if (!site || !cardTemplate) return;
  
  const card = cardTemplate.content.cloneNode(true);
  const div = card.querySelector('.card');
  const faviconImg = div.querySelector('.favicon-img');
  const faviconFallback = div.querySelector('.favicon-fallback');
  const cardTitle = div.querySelector('.card-title');
  
  // Apply custom color if set
  if (site.color) {
    div.style.borderColor = site.color + '40'; // Add transparency
    div.style.background = `linear-gradient(135deg, ${site.color}20, rgba(255, 255, 255, 0.08))`;
  }
  
  // Set up favicon
  const faviconUrl = getFaviconUrl(site.url);
  if (faviconUrl) {
    faviconImg.src = faviconUrl;
    faviconImg.style.display = 'block';
    faviconFallback.style.display = 'none';
    
    faviconImg.onerror = () => {
      faviconImg.style.display = 'none';
      faviconFallback.style.display = 'flex';
      faviconFallback.textContent = getInitials(site.name);
      if (site.color) {
        faviconFallback.style.background = `linear-gradient(135deg, ${site.color}, ${site.color}CC)`;
      }
    };
  } else {
    faviconImg.style.display = 'none';
    faviconFallback.style.display = 'flex';
    faviconFallback.textContent = getInitials(site.name);
    if (site.color) {
      faviconFallback.style.background = `linear-gradient(135deg, ${site.color}, ${site.color}CC)`;
    }
  }
  
  // Set card content
  cardTitle.textContent = site.name;
  
  // Set up drag and drop
  div.draggable = true;
  div.dataset.index = index;
  div.dataset.originalIndex = index;
  
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);
  
  // Click to open site (only if not dragging)
  div.addEventListener('click', (e) => {
    if (!isDragging) {
      window.open(site.url, '_blank');
    }
  });
  
  // Right-click context menu
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, site, index);
  });
  
  dialGrid.appendChild(card);
}

function handleDragStart(e) {
  if (!e.target || !e.target.dataset) return;
  
  draggedElement = e.target;
  draggedIndex = parseInt(e.target.dataset.index);
  
  if (isNaN(draggedIndex) || draggedIndex < 0 || draggedIndex >= sites.length) {
    e.preventDefault();
    return;
  }
  
  isDragging = true;
  currentDropZone = draggedIndex;
  
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', '');
  
  // Calculate drop zones
  calculateDropZones();
  
  // Add visual feedback to all other cards
  document.querySelectorAll('.card:not(.add-card)').forEach(card => {
    if (card !== e.target) {
      card.classList.add('drag-active');
    }
  });
  
  // Set up global drag over listener
  document.addEventListener('dragover', handleGlobalDragOver);
}

function handleGlobalDragOver(e) {
  e.preventDefault();
  
  if (!isDragging || draggedIndex === -1) return;
  
  const newDropZone = getClosestDropZone(e.clientX, e.clientY);
  
  if (newDropZone !== currentDropZone) {
    currentDropZone = newDropZone;
    updateCardPositions(currentDropZone);
  }
}

function handleDragEnd(e) {
  isDragging = false;
  
  // Remove global listener
  document.removeEventListener('dragover', handleGlobalDragOver);
  
  // Perform the actual reorder if position changed and indices are valid
  if (currentDropZone !== draggedIndex && 
      currentDropZone >= 0 && 
      currentDropZone <= sites.length &&
      draggedIndex >= 0 && 
      draggedIndex < sites.length) {
    
    let finalIndex = currentDropZone;
    
    // Adjust for the removal of the dragged item
    if (finalIndex > draggedIndex) {
      finalIndex--;
    }
    
    // Ensure final index is within bounds
    if (finalIndex >= 0 && finalIndex < sites.length) {
      // Reorder the sites array
      const draggedSite = sites[draggedIndex];
      sites.splice(draggedIndex, 1);
      sites.splice(finalIndex, 0, draggedSite);
      
      saveSites();
    }
  }
  
  // Clean up all drag-related classes and transforms
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('dragging', 'drag-active', 'displaced');
    card.style.transform = '';
  });
  
  // Reset variables
  draggedElement = null;
  draggedIndex = -1;
  currentDropZone = -1;
  dropZones = [];
  
  // Re-render to ensure everything is in the correct position
  render();
}

function closeAllPopups() {
  document.getElementById('popup').style.display = 'none';
  document.getElementById('editPopup').style.display = 'none';
  document.getElementById('settingsPopup').style.display = 'none';
  document.getElementById('bookmarkFolderPopup').style.display = 'none';
  editingIndex = -1;
}

// Close popups when clicking away
document.addEventListener('click', (e) => {
  const popup = document.getElementById('popup');
  const editPopup = document.getElementById('editPopup');
  const settingsPopup = document.getElementById('settingsPopup');
  const bookmarkPopup = document.getElementById('bookmarkFolderPopup');
  const settingsBtn = document.getElementById('settingsBtn');
  
  if (!popup.contains(e.target) && popup.style.display === 'flex') {
    closeAllPopups();
  }
  
  if (!editPopup.contains(e.target) && editPopup.style.display === 'flex') {
    closeAllPopups();
  }
  
  if (!bookmarkPopup.contains(e.target) && bookmarkPopup.style.display === 'flex') {
    closeAllPopups();
  }
  
  if (!settingsPopup.contains(e.target) && !settingsBtn.contains(e.target) && settingsPopup.style.display === 'block') {
    settingsPopup.style.display = 'none';
  }
});

// Popup close buttons
document.getElementById('popupClose').onclick = closeAllPopups;
document.getElementById('editPopupClose').onclick = closeAllPopups;
document.getElementById('bookmarkFolderClose').onclick = closeAllPopups;

// Edit popup buttons
document.getElementById('editCancel').onclick = closeAllPopups;
document.getElementById('editSave').onclick = () => {
  const name = document.getElementById('editSiteName').value.trim();
  let url = document.getElementById('editSiteURL').value.trim();
  const color = document.getElementById('editSiteColor').value;
  
  if (!name || !url) return;
  
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  
  if (editingIndex >= 0) {
    sites[editingIndex] = { name, url, color };
    saveSites();
    render();
  }
  
  closeAllPopups();
};

const settingsBtn = document.getElementById('settingsBtn');
const settingsPopup = document.getElementById('settingsPopup');

settingsBtn.onclick = (e) => {
  e.stopPropagation();
  const isVisible = settingsPopup.style.display === 'block';
  settingsPopup.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    loadSavedSettings();
  }
};

function applyCustomGradient() {
  const color1 = document.getElementById('color1').value;
  const color2 = document.getElementById('color2').value;
  
  const gradient = `radial-gradient(ellipse at bottom, ${color1}, ${color2})`;
  document.body.style.background = gradient;
  
  const gradientData = `${color1.substring(1)},${color2.substring(1)}`;
  chrome.storage.sync.set({ gradient: gradientData }, () => {
    console.log("Auto-saved custom gradient:", gradientData);
  });
}

function loadSavedSettings() {
  chrome.storage.sync.get(['gradient', 'fontSize', 'useSuggestions', 'gridColumns', 'showSearch'], data => {
    if (data.gradient) {
      const [c1, c2] = data.gradient.split(',');
      document.getElementById('color1').value = `#${c1.trim()}`;
      document.getElementById('color2').value = `#${c2.trim()}`;
    }
    
    const baseFontSize = data.fontSize || 100;
    const gridColumns = data.gridColumns || 7;
    
    document.getElementById('fontSizeSlider').value = baseFontSize;
    document.getElementById('fontValue').textContent = `${baseFontSize}%`;
    
    // Set the correct radio button
    document.getElementById(`gridColumns${gridColumns}`).checked = true;
    
    document.getElementById('toggleSuggestions').checked = data.useSuggestions ?? true;
    document.getElementById('toggleSearch').checked = data.showSearch ?? false;
    
    // Apply combined font size
    applyCombinedFontSize(baseFontSize, gridColumns);
  });
}

// Font size controls
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontValue = document.getElementById('fontValue');

fontSizeSlider.addEventListener('input', () => {
  const size = parseInt(fontSizeSlider.value);
  fontValue.textContent = `${size}%`;
  
  // Get current grid columns
  chrome.storage.sync.get(['gridColumns'], data => {
    const gridColumns = data.gridColumns || 7;
    applyCombinedFontSize(size, gridColumns);
  });
  
  chrome.storage.sync.set({ fontSize: size }, () => {
    console.log("Saved font size:", size + "%");
  });
});

// Grid column controls
document.querySelectorAll('input[name="gridColumnsOption"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      const gridColumns = parseInt(e.target.value);
      
      // Save to storage
      chrome.storage.sync.set({ gridColumns: gridColumns }, () => {
        console.log("Saved grid columns:", gridColumns);
      });
      
      // Update CSS variable
      document.documentElement.style.setProperty('--grid-columns', gridColumns);
      
      // Apply combined font size
      chrome.storage.sync.get(['fontSize'], data => {
        const baseFontSize = data.fontSize || 100;
        applyCombinedFontSize(baseFontSize, gridColumns);
      });
      
      // Re-render grid
      render();
    }
  });
});

document.getElementById('color1').oninput = applyCustomGradient;
document.getElementById('color2').oninput = applyCustomGradient;

document.querySelectorAll('.preset-sample').forEach(sample => {
  sample.onclick = () => {
    const gradientData = sample.dataset.bg;
    const [c1, c2] = gradientData.split(',');
    
    document.getElementById('color1').value = `#${c1.trim()}`;
    document.getElementById('color2').value = `#${c2.trim()}`;
    
    const gradient = `radial-gradient(ellipse at bottom, #${c1.trim()}, #${c2.trim()})`;
    document.body.style.background = gradient;
    
    chrome.storage.sync.set({ gradient: gradientData }, () => {
      console.log("Applied and saved preset gradient:", gradientData);
    });
  };
});

document.getElementById('toggleSuggestions').onchange = (e) => {
  chrome.storage.sync.set({ useSuggestions: e.target.checked });
};

// Search toggle functionality
document.getElementById('toggleSearch').onchange = (e) => {
  const searchContainer = document.getElementById('searchContainer');
  const showSearch = e.target.checked;
  
  if (showSearch) {
    searchContainer.style.display = 'block';
  } else {
    searchContainer.style.display = 'none';
    // Clear search when hiding
    searchInput.value = '';
    updateSearchClear();
  }
  
  chrome.storage.sync.set({ showSearch: showSearch }, () => {
    console.log("Saved search visibility:", showSearch);
  });
};

// Bookmark folder selection functionality
function showBookmarkFolderSelection() {
  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const folders = [];
    
    function extractFolders(nodes, path = '') {
      nodes.forEach(node => {
        if (node.children) {
          // It's a folder
          const folderPath = path ? `${path} > ${node.title}` : node.title;
          const bookmarkCount = countBookmarksInFolder(node);
          
          if (bookmarkCount > 0) {
            folders.push({
              id: node.id,
              title: node.title,
              path: folderPath,
              count: bookmarkCount,
              node: node
            });
          }
          
          // Recurse into subfolders
          extractFolders(node.children, folderPath);
        }
      });
    }
    
    function countBookmarksInFolder(folder) {
      let count = 0;
      if (folder.children) {
        folder.children.forEach(child => {
          if (child.url) {
            count++;
          } else if (child.children) {
            count += countBookmarksInFolder(child);
          }
        });
      }
      return count;
    }
    
    extractFolders(bookmarkTreeNodes);
    
    if (folders.length > 0) {
      renderBookmarkFolders(folders);
      document.getElementById('bookmarkFolderPopup').style.display = 'flex';
    } else {
      alert('No bookmark folders with bookmarks found.');
    }
  });
}

function renderBookmarkFolders(folders) {
  const folderList = document.getElementById('folderList');
  folderList.innerHTML = '';
  
  folders.forEach(folder => {
    const folderItem = folderTemplate.content.cloneNode(true);
    const checkbox = folderItem.querySelector('.folder-check');
    const name = folderItem.querySelector('.folder-name');
    const count = folderItem.querySelector('.folder-count');
    
    checkbox.value = folder.id;
    name.textContent = folder.path;
    count.textContent = `${folder.count} bookmarks`;
    
    folderList.appendChild(folderItem);
  });
}

// Import from Bookmarks functionality
document.getElementById('importBookmarksBtn').onclick = () => {
  showBookmarkFolderSelection();
};

// Bookmark folder popup buttons
document.getElementById('bookmarkCancel').onclick = closeAllPopups;

document.getElementById('bookmarkImport').onclick = () => {
  const selectedFolders = Array.from(document.querySelectorAll('.folder-check:checked'));
  
  if (selectedFolders.length === 0) {
    alert('Please select at least one folder to import.');
    return;
  }
  
  const folderIds = selectedFolders.map(cb => cb.value);
  
  // Get all bookmarks from selected folders
  Promise.all(folderIds.map(id => 
    new Promise(resolve => {
      chrome.bookmarks.getSubTree(id, (results) => {
        const bookmarks = [];
        
        function extractBookmarks(nodes) {
          nodes.forEach(node => {
            if (node.url) {
              bookmarks.push({
                name: node.title || node.url,
                url: node.url,
                color: '#667eea'
              });
            } else if (node.children) {
              extractBookmarks(node.children);
            }
          });
        }
        
        extractBookmarks(results);
        resolve(bookmarks);
      });
    })
  )).then(folderBookmarks => {
    const allBookmarks = folderBookmarks.flat();
    
    if (allBookmarks.length > 0) {
      const replace = confirm(
        `Found ${allBookmarks.length} bookmarks in selected folders.\n\n` +
        'Click "OK" to replace all current sites with bookmarks.\n' +
        'Click "Cancel" to add bookmarks to existing sites.'
      );
      
      if (replace) {
        sites = allBookmarks;
      } else {
        // Merge bookmarks with existing sites, avoiding duplicates
        allBookmarks.forEach(bookmark => {
          const exists = sites.some(site => site.url === bookmark.url);
          if (!exists) {
            sites.push(bookmark);
          }
        });
      }
      
      saveSites();
      render();
      closeAllPopups();
      
      const action = replace ? 'replaced with' : 'added from';
      alert(`Successfully ${action} ${allBookmarks.length} bookmarks!`);
    } else {
      alert('No bookmarks found in selected folders.');
    }
  });
};

// Export/Import functionality
document.getElementById('exportBtn').onclick = () => {
  const dataStr = JSON.stringify(sites, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'speed-dial-sites.json';
  link.click();
  
  URL.revokeObjectURL(url);
};

document.getElementById('importBtn').onclick = () => {
  document.getElementById('importFile').click();
};

document.getElementById('importFile').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (Array.isArray(importedData)) {
        sites = importedData;
        saveSites();
        render();
        alert('Sites imported successfully!');
      } else {
        alert('Invalid file format. Please select a valid JSON file.');
      }
    } catch (error) {
      alert('Error reading file. Please select a valid JSON file.');
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  e.target.value = '';
};

// Collapsible suggestions functionality
document.getElementById('suggestionsToggle').onclick = () => {
  const suggestionsList = document.getElementById('suggestions');
  const suggestionsIcon = document.querySelector('.suggestions-icon');
  const suggestionsHeader = document.getElementById('suggestionsToggle');
  
  if (suggestionsList.style.display === 'none') {
    suggestionsList.style.display = 'flex';
    suggestionsIcon.textContent = '−';
    suggestionsHeader.classList.add('expanded');
    renderSuggestions();
  } else {
    suggestionsList.style.display = 'none';
    suggestionsIcon.textContent = '+';
    suggestionsHeader.classList.remove('expanded');
  }
};

loadSites();
render();
loadSavedSettings();

function showContextMenu(e, site, index) {
  const existingMenu = document.getElementById('contextMenu');
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'contextMenu';
  menu.className = 'context-menu';
  menu.innerHTML = `
    <div class="menu-item" data-action="open-tab">Open in new tab</div>
    <div class="menu-item" data-action="open-window">Open in new window</div>
    <div class="menu-item" data-action="open-incognito">Open in private window</div>
    <div class="menu-separator"></div>
    <div class="menu-item" data-action="edit">Edit</div>
    <div class="menu-item" data-action="delete">Delete</div>
  `;

  menu.style.top = `${e.clientY}px`;
  menu.style.left = `${e.clientX}px`;
  document.body.appendChild(menu);

  menu.addEventListener('click', (e) => {
    e.stopPropagation(); // This is the key fix!
    const action = e.target.dataset.action;
    
    switch (action) {
      case 'open-tab':
        window.open(site.url, '_blank');
        break;
      case 'open-window':
        window.open(site.url, '_blank', 'width=1200,height=800');
        break;
      case 'open-incognito':
        chrome.windows.create({ url: site.url, incognito: true });
        break;
      case 'edit':
        showPopup(index);
        break;
      case 'delete':
        sites.splice(index, 1);
        saveSites();
        render();
        break;
    }
    
    menu.remove();
  });

  document.addEventListener('click', () => {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.remove();
  }, { once: true });
}