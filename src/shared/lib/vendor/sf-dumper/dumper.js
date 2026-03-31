export function SfdumpWrap(doc) {
  // SVG icons (16x16 viewBox, stroke-based, 1.5px stroke)
  var svgAttrs =
    'xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  var icons = {
    chevronRight: '<svg ' + svgAttrs + '><polyline points="9 18 15 12 9 6"/></svg>',
    chevronDown: '<svg ' + svgAttrs + '><polyline points="6 9 12 15 18 9"/></svg>',
    expandAll:
      '<svg ' +
      svgAttrs +
      '><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>',
    collapseAll:
      '<svg ' +
      svgAttrs +
      '><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>',
    copy:
      '<svg ' +
      svgAttrs +
      '><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg ' + svgAttrs + '><polyline points="20 6 9 17 4 12"/></svg>',
    info:
      '<svg ' +
      svgAttrs +
      '><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    arrowUp: '<svg ' + svgAttrs + '><polyline points="18 15 12 9 6 15"/></svg>',
    arrowDown: '<svg ' + svgAttrs + '><polyline points="6 9 12 15 18 9"/></svg>',
    strExpand:
      '<svg ' + svgAttrs + ' width="10" height="10"><polyline points="9 18 15 12 9 6"/></svg>',
    strCollapse:
      '<svg ' + svgAttrs + ' width="10" height="10"><polyline points="15 18 9 12 15 6"/></svg>'
  }

  let refStyle = doc.createElement('style'),
    rxEsc = /([.*+?^${}()|\[\]\/\\])/g,
    idRx = /\bsf-dump-\d+-ref[012]\w+\b/,
    keyHint = 0 <= navigator.platform.toUpperCase().indexOf('MAC') ? 'Cmd' : 'Ctrl',
    addEventListener = function (e, n, cb) {
      e.addEventListener(n, cb, false)
    }
  refStyle.innerHTML =
    'pre.sf-dump .sf-dump-compact, .sf-dump-str-collapse .sf-dump-str-collapse, .sf-dump-str-expand .sf-dump-str-expand { display: none; }'
  ;(doc.documentElement.firstElementChild || doc.documentElement.children[0]).appendChild(refStyle)
  refStyle = doc.createElement('style')
  ;(doc.documentElement.firstElementChild || doc.documentElement.children[0]).appendChild(refStyle)
  if (!doc.addEventListener) {
    addEventListener = function (element, eventName, callback) {
      element.attachEvent('on' + eventName, function (e) {
        e.preventDefault = function () {
          e.returnValue = false
        }
        e.target = e.srcElement
        callback(e)
      })
    }
  }

  function toggle(a, recursive) {
    var s = a.nextSibling || {},
      oldClass = s.className,
      arrow,
      newClass
    if (/\bsf-dump-compact\b/.test(oldClass)) {
      arrow = icons.chevronDown
      newClass = 'sf-dump-expanded'
    } else if (/\bsf-dump-expanded\b/.test(oldClass)) {
      arrow = icons.chevronRight
      newClass = 'sf-dump-compact'
    } else {
      return false
    }
    if (doc.createEvent && s.dispatchEvent) {
      var event = doc.createEvent('Event')
      event.initEvent(
        'sf-dump-expanded' === newClass ? 'sfbeforedumpexpand' : 'sfbeforedumpcollapse',
        true,
        false
      )
      s.dispatchEvent(event)
    }
    a.lastChild.innerHTML = arrow
    s.className = s.className.replace(/\bsf-dump-(compact|expanded)\b/, newClass)
    if (recursive) {
      try {
        a = s.querySelectorAll('.' + oldClass)
        for (s = 0; s < a.length; ++s) {
          if (-1 == a[s].className.indexOf(newClass)) {
            a[s].className = newClass
            a[s].previousSibling.lastChild.innerHTML = arrow
          }
        }
      } catch (e) {}
    }
    return true
  }

  function collapse(a, recursive) {
    var s = a.nextSibling || {},
      oldClass = s.className
    if (/\bsf-dump-expanded\b/.test(oldClass)) {
      toggle(a, recursive)
      return true
    }
    return false
  }

  function expand(a, recursive) {
    var s = a.nextSibling || {},
      oldClass = s.className
    if (/\bsf-dump-compact\b/.test(oldClass)) {
      toggle(a, recursive)
      return true
    }
    return false
  }

  function collapseAll(root) {
    var a = root.querySelector('a.sf-dump-toggle')
    if (a) {
      collapse(a, true)
      expand(a)
      return true
    }
    return false
  }

  function expandToDepth(root, maxDepth) {
    var allSamp = root.querySelectorAll('samp[data-depth]')
    for (var i = 0; i < allSamp.length; i++) {
      var samp = allSamp[i]
      var depth = parseInt(samp.getAttribute('data-depth'), 10)
      var link = samp.previousSibling
      if (link && link.tagName === 'A') {
        if (depth <= maxDepth) {
          expand(link, false)
        } else {
          collapse(link, false)
        }
      }
    }
  }

  function reveal(node) {
    var previous,
      parents = []
    while (
      (node = node.parentNode || {}) &&
      (previous = node.previousSibling) &&
      'A' === previous.tagName
    ) {
      parents.push(previous)
    }
    if (0 !== parents.length) {
      parents.forEach(function (parent) {
        expand(parent)
      })
      return true
    }
    return false
  }

  function highlight(root, activeNode, nodes) {
    resetHighlightedNodes(root)
    Array.from(nodes || []).forEach(function (node) {
      if (!/\bsf-dump-highlight\b/.test(node.className)) {
        node.className = node.className + ' sf-dump-highlight'
      }
    })
    if (!/\bsf-dump-highlight-active\b/.test(activeNode.className)) {
      activeNode.className = activeNode.className + ' sf-dump-highlight-active'
    }
  }

  function resetHighlightedNodes(root) {
    Array.from(
      root.querySelectorAll(
        '.sf-dump-str, .sf-dump-key, .sf-dump-public, .sf-dump-protected, .sf-dump-private'
      )
    ).forEach(function (strNode) {
      strNode.className = strNode.className.replace(/\bsf-dump-highlight\b/, '')
      strNode.className = strNode.className.replace(/\bsf-dump-highlight-active\b/, '')
    })
  }

  // --- Statistics helpers ---
  function collectStats(root) {
    var props = root.querySelectorAll('.sf-dump-public, .sf-dump-protected, .sf-dump-private')
    var keys = root.querySelectorAll('.sf-dump-key')
    var strs = root.querySelectorAll('.sf-dump-str')
    var nums = root.querySelectorAll('.sf-dump-num')
    var consts = root.querySelectorAll('.sf-dump-const')
    var notes = root.querySelectorAll('.sf-dump-note')
    var samps = root.querySelectorAll('samp[data-depth]')
    var maxDepth = 0
    for (var i = 0; i < samps.length; i++) {
      var d = parseInt(samps[i].getAttribute('data-depth'), 10)
      if (d > maxDepth) maxDepth = d
    }
    return {
      properties: props.length,
      keys: keys.length,
      strings: strs.length,
      numbers: nums.length,
      constants: consts.length,
      objects: notes.length,
      maxDepth: maxDepth,
      totalNodes: props.length + keys.length + strs.length + nums.length + consts.length
    }
  }

  return function (root, x) {
    root = doc.getElementById(root)
    var indentRx = new RegExp(
        '^(' + (root.getAttribute('data-indent-pad') || ' ').replace(rxEsc, '\\$1') + ')+',
        'm'
      ),
      options = { maxDepth: 1, maxStringLength: 160, fileLinkFormat: false },
      elt = root.getElementsByTagName('A'),
      len = elt.length,
      i = 0,
      s,
      h,
      t = []
    while (i < len) t.push(elt[i++])
    for (i in x) {
      options[i] = x[i]
    }

    function a(e, f) {
      addEventListener(root, e, function (e, n) {
        // Skip events from toolbar/stats/breadcrumb
        if (e.target.closest && e.target.closest('.sf-dump-toolbar')) {
          return
        }

        // Find the closest <A> ancestor (handles clicks on deeply nested SVG arrows)
        var anchor = e.target.closest ? e.target.closest('a') : null
        if (!anchor && e.target.tagName === 'A') anchor = e.target
        if (!anchor && e.target.parentNode && e.target.parentNode.tagName === 'A')
          anchor = e.target.parentNode

        if (anchor) {
          f(anchor, e)
        } else {
          n = /\bsf-dump-ellipsis\b/.test(e.target.className) ? e.target.parentNode : e.target
          if ((n = n.nextElementSibling) && 'A' == n.tagName) {
            if (!/\bsf-dump-toggle\b/.test(n.className)) {
              n = n.nextElementSibling || n
            }
            f(n, e, true)
          }
        }
      })
    }

    function isCtrlKey(e) {
      return e.ctrlKey || e.metaKey
    }

    function xpathString(str) {
      var parts = str.match(/[^'"]+|['"]/g).map(function (part) {
        if ("'" == part) {
          return '"\'"'
        }
        if ('"' == part) {
          return "'\"'"
        }
        return "'" + part + "'"
      })
      return 'concat(' + parts.join(',') + ", '')"
    }

    function xpathHasClass(className) {
      return "contains(concat(' ', normalize-space(@class), ' '), ' " + className + " ')"
    }

    addEventListener(root, 'mouseover', function (e) {
      if ('' != refStyle.innerHTML) {
        refStyle.innerHTML = ''
      }
    })
    a('mouseover', function (a, e, c) {
      if (c) {
        e.target.style.cursor = 'pointer'
      } else if ((a = idRx.exec(a.className))) {
        try {
          refStyle.innerHTML =
            'pre.sf-dump .' +
            a[0] +
            '{background-color: #B729D9; color: #FFF !important; border-radius: 2px}'
        } catch (e) {}
      }
    })
    a('click', function (a, e, c) {
      if (/\bsf-dump-toggle\b/.test(a.className)) {
        e.preventDefault()
        if (!toggle(a, isCtrlKey(e))) {
          var r = doc.getElementById(a.getAttribute('href').substr(1)),
            s = r.previousSibling,
            f = r.parentNode,
            t = a.parentNode
          t.replaceChild(r, a)
          f.replaceChild(a, s)
          t.insertBefore(s, r)
          f = f.firstChild.nodeValue.match(indentRx)
          t = t.firstChild.nodeValue.match(indentRx)
          if (f && t && f[0] !== t[0]) {
            r.innerHTML = r.innerHTML.replace(
              new RegExp('^' + f[0].replace(rxEsc, '\\$1'), 'mg'),
              t[0]
            )
          }
          if (/\bsf-dump-compact\b/.test(r.className)) {
            toggle(s, isCtrlKey(e))
          }
        }
        if (c) {
        } else if (doc.getSelection) {
          try {
            doc.getSelection().removeAllRanges()
          } catch (e) {
            doc.getSelection().empty()
          }
        } else {
          doc.selection.empty()
        }
      } else if (/\bsf-dump-str-toggle\b/.test(a.className)) {
        e.preventDefault()
        e = a.parentNode.parentNode
        e.className = e.className.replace(
          /\bsf-dump-str-(expand|collapse)\b/,
          a.parentNode.className
        )
      }
    })
    elt = root.getElementsByTagName('SAMP')
    len = elt.length
    i = 0
    while (i < len) t.push(elt[i++])
    len = t.length
    for (i = 0; i < len; ++i) {
      elt = t[i]
      if ('SAMP' == elt.tagName) {
        a = elt.previousSibling || {}
        if ('A' != a.tagName) {
          a = doc.createElement('A')
          a.className = 'sf-dump-ref'
          elt.parentNode.insertBefore(a, elt)
        } else {
          a.innerHTML += ' '
        }
        a.title = (a.title ? a.title + '\n[' : '[') + keyHint + '+click] Expand all children'
        a.innerHTML +=
          elt.className == 'sf-dump-compact'
            ? '<span class="sf-dump-toggle-icon">' + icons.chevronRight + '</span>'
            : '<span class="sf-dump-toggle-icon">' + icons.chevronDown + '</span>'
        a.className += ' sf-dump-toggle'
        x = 1
        if ('sf-dump' != elt.parentNode.className) {
          x += elt.parentNode.getAttribute('data-depth') / 1
        }
      } else if (/\bsf-dump-ref\b/.test(elt.className) && (a = elt.getAttribute('href'))) {
        a = a.substr(1)
        elt.className += ' ' + a
        if (/[\[{]$/.test(elt.previousSibling.nodeValue)) {
          a = a != elt.nextSibling.id && doc.getElementById(a)
          try {
            s = a.nextSibling
            elt.appendChild(a)
            s.parentNode.insertBefore(a, s)
            if (/^[@#]/.test(elt.innerHTML)) {
              elt.innerHTML +=
                ' <span class="sf-dump-toggle-icon">' + icons.chevronRight + '</span>'
            } else {
              elt.innerHTML = '<span class="sf-dump-toggle-icon">' + icons.chevronRight + '</span>'
              elt.className = 'sf-dump-ref'
            }
            elt.className += ' sf-dump-toggle'
          } catch (e) {
            if ('&' == elt.innerHTML.charAt(0)) {
              elt.innerHTML = '&hellip;'
              elt.className = 'sf-dump-ref'
            }
          }
        }
      }
    }

    // === CONTEXT MENU + SEARCH BAR (Ctrl+F) ===
    if (doc.evaluate && Array.from && root.children.length > 1) {
      root.setAttribute('tabindex', 0)

      var stats = collectStats(root)
      var statParts = []
      if (stats.properties > 0) statParts.push('Props: ' + stats.properties)
      if (stats.keys > 0) statParts.push('Keys: ' + stats.keys)
      if (stats.strings > 0) statParts.push('Strings: ' + stats.strings)
      if (stats.numbers > 0) statParts.push('Numbers: ' + stats.numbers)
      if (stats.objects > 0) statParts.push('Objects: ' + stats.objects)
      if (stats.maxDepth > 0) statParts.push('Depth: ' + stats.maxDepth)

      // --- Search bar (hidden until Ctrl+F) ---
      var searchBar = doc.createElement('div')
      searchBar.className = 'sf-dump-search-bar'
      searchBar.style.display = 'none'

      var searchInput = doc.createElement('input')
      searchInput.type = 'text'
      searchInput.className = 'sf-dump-search-input'
      searchInput.placeholder = 'Search... (Esc to close)'

      var counter = doc.createElement('span')
      counter.className = 'sf-dump-search-count'
      counter.textContent = '0 / 0'

      var btnPrev = doc.createElement('button')
      btnPrev.type = 'button'
      btnPrev.className = 'sf-dump-search-nav'
      btnPrev.innerHTML = icons.arrowUp
      btnPrev.title = 'Previous (Shift+Enter)'

      var btnNext = doc.createElement('button')
      btnNext.type = 'button'
      btnNext.className = 'sf-dump-search-nav'
      btnNext.innerHTML = icons.arrowDown
      btnNext.title = 'Next (Enter)'

      searchBar.appendChild(searchInput)
      searchBar.appendChild(counter)
      searchBar.appendChild(btnPrev)
      searchBar.appendChild(btnNext)
      root.insertBefore(searchBar, root.firstChild)

      function showSearch() {
        searchBar.style.display = ''
        searchInput.focus()
        searchInput.select()
      }
      function hideSearch() {
        searchBar.style.display = 'none'
        resetHighlightedNodes(root)
        searchInput.value = ''
        searchInput.blur()
        previousSearchQuery = ''
        counter.textContent = '0 / 0'
        state.reset()
      }

      // --- Context menu ---
      var ctxMenu = doc.createElement('div')
      ctxMenu.className = 'sf-dump-ctx-menu'
      ctxMenu.style.display = 'none'

      var menuHtml =
        '<button class="sf-dump-ctx-item" data-action="expand-all">' +
        icons.expandAll +
        ' Expand all</button>' +
        '<button class="sf-dump-ctx-item" data-action="collapse-all">' +
        icons.collapseAll +
        ' Collapse all</button>'

      // Depth buttons
      if (stats.maxDepth > 1) {
        menuHtml +=
          '<div class="sf-dump-ctx-sep"></div><div class="sf-dump-ctx-label">Expand to depth</div><div class="sf-dump-ctx-depths">'
        var depths = []
        for (var d = 1; d <= Math.min(stats.maxDepth, 5); d++) depths.push(d)
        if (stats.maxDepth > 5) depths.push(stats.maxDepth)
        depths.forEach(function (depth) {
          menuHtml +=
            '<button class="sf-dump-ctx-depth" data-depth="' + depth + '">' + depth + '</button>'
        })
        menuHtml += '</div>'
      }

      menuHtml +=
        '<div class="sf-dump-ctx-sep"></div>' +
        '<button class="sf-dump-ctx-item" data-action="search">' +
        icons.info +
        ' Search (' +
        keyHint +
        '+F)</button>' +
        '<button class="sf-dump-ctx-item" data-action="copy">' +
        icons.copy +
        ' Copy</button>'

      // Stats line
      if (statParts.length > 0) {
        menuHtml +=
          '<div class="sf-dump-ctx-sep"></div><div class="sf-dump-ctx-stats">' +
          statParts.join(' · ') +
          '</div>'
      }

      ctxMenu.innerHTML = menuHtml
      doc.body.appendChild(ctxMenu)

      function hideCtxMenu() {
        ctxMenu.style.display = 'none'
      }

      addEventListener(root, 'contextmenu', function (e) {
        if (e.target.closest && e.target.closest('.sf-dump-search-bar')) return
        if (e.target.tagName === 'INPUT') return

        e.preventDefault()
        ctxMenu.style.display = ''
        ctxMenu.style.left = e.pageX + 'px'
        ctxMenu.style.top = e.pageY + 'px'

        requestAnimationFrame(function () {
          var rect = ctxMenu.getBoundingClientRect()
          if (rect.right > window.innerWidth) {
            ctxMenu.style.left = e.pageX - rect.width + 'px'
          }
          if (rect.bottom > window.innerHeight) {
            ctxMenu.style.top = e.pageY - rect.height + 'px'
          }
        })
      })

      addEventListener(doc, 'click', hideCtxMenu)
      addEventListener(doc, 'contextmenu', function (e) {
        if (!root.contains(e.target)) hideCtxMenu()
      })
      addEventListener(window, 'scroll', hideCtxMenu)

      addEventListener(ctxMenu, 'click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-action], [data-depth]') : e.target
        if (!btn) return
        e.preventDefault()
        e.stopPropagation()
        hideCtxMenu()

        var action = btn.getAttribute('data-action')
        var depth = btn.getAttribute('data-depth')

        if (action === 'expand-all') {
          var allToggles = root.querySelectorAll('a.sf-dump-toggle')
          for (var ti = 0; ti < allToggles.length; ti++) expand(allToggles[ti], false)
        } else if (action === 'collapse-all') {
          var allToggles2 = root.querySelectorAll('a.sf-dump-toggle')
          for (var ti2 = 0; ti2 < allToggles2.length; ti2++) collapse(allToggles2[ti2], false)
          var first = root.querySelector('a.sf-dump-toggle')
          if (first) expand(first, false)
        } else if (action === 'search') {
          showSearch()
        } else if (action === 'copy') {
          var text = root.innerText || root.textContent || ''
          if (navigator.clipboard) navigator.clipboard.writeText(text.trim())
        } else if (depth) {
          collapseAll(root)
          expandToDepth(root, parseInt(depth, 10))
        }
      })

      // --- Search logic ---
      var SearchState = function () {
        this.nodes = []
        this.idx = 0
      }
      SearchState.prototype = {
        next: function () {
          if (this.isEmpty()) return this.current()
          this.idx = this.idx < this.nodes.length - 1 ? this.idx + 1 : 0
          return this.current()
        },
        previous: function () {
          if (this.isEmpty()) return this.current()
          this.idx = this.idx > 0 ? this.idx - 1 : this.nodes.length - 1
          return this.current()
        },
        isEmpty: function () {
          return 0 === this.count()
        },
        current: function () {
          if (this.isEmpty()) return null
          return this.nodes[this.idx]
        },
        reset: function () {
          this.nodes = []
          this.idx = 0
        },
        count: function () {
          return this.nodes.length
        }
      }

      function showCurrent(state) {
        var currentNode = state.current()
        if (currentNode) {
          reveal(currentNode)
          highlight(root, currentNode, state.nodes)
          if ('scrollIntoView' in currentNode) {
            currentNode.scrollIntoView(true)
            var currentRect = currentNode.getBoundingClientRect()
            var barRect = searchBar.getBoundingClientRect()
            if (currentRect.top < barRect.bottom + 5) {
              window.scrollBy(0, -(barRect.height + 10))
            }
          }
        }
        counter.textContent = (state.isEmpty() ? 0 : state.idx + 1) + ' / ' + state.count()
      }

      var state = new SearchState()
      var searchInputTimer = 0
      var previousSearchQuery = ''

      addEventListener(searchInput, 'keyup', function (e) {
        var searchQuery = e.target.value
        if (searchQuery === previousSearchQuery) return
        previousSearchQuery = searchQuery
        clearTimeout(searchInputTimer)
        searchInputTimer = setTimeout(function () {
          state.reset()
          collapseAll(root)
          resetHighlightedNodes(root)
          if ('' === searchQuery) {
            counter.textContent = '0 / 0'
            return
          }
          var classMatches = [
            'sf-dump-str',
            'sf-dump-key',
            'sf-dump-public',
            'sf-dump-protected',
            'sf-dump-private'
          ]
            .map(xpathHasClass)
            .join(' or ')

          var xpathResult = doc.evaluate(
            './/span[' +
              classMatches +
              '][contains(translate(child::text(), ' +
              xpathString(searchQuery.toUpperCase()) +
              ', ' +
              xpathString(searchQuery.toLowerCase()) +
              '), ' +
              xpathString(searchQuery.toLowerCase()) +
              ')]',
            root,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null
          )
          var node
          while ((node = xpathResult.iterateNext())) state.nodes.push(node)
          showCurrent(state)
        }, 300)
      })

      addEventListener(btnPrev, 'click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        state.previous()
        searchInput.focus()
        collapseAll(root)
        showCurrent(state)
      })
      addEventListener(btnNext, 'click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        state.next()
        searchInput.focus()
        collapseAll(root)
        showCurrent(state)
      })

      addEventListener(root, 'keydown', function (e) {
        // Ctrl+F → show search bar
        if (isCtrlKey(e) && 70 === e.keyCode) {
          if (document.activeElement === searchInput) return
          e.preventDefault()
          showSearch()
        } else if (document.activeElement === searchInput) {
          // Esc → close search bar
          if (27 === e.keyCode) {
            e.preventDefault()
            hideSearch()
            // Enter / Shift+Enter → next/prev match
          } else if (13 === e.keyCode || 114 === e.keyCode) {
            e.preventDefault()
            e.shiftKey ? state.previous() : state.next()
            collapseAll(root)
            showCurrent(state)
          }
        }
      })
    }

    if (0 >= options.maxStringLength) {
      return
    }
    try {
      elt = root.querySelectorAll('.sf-dump-str')
      len = elt.length
      i = 0
      t = []
      while (i < len) t.push(elt[i++])
      len = t.length
      for (i = 0; i < len; ++i) {
        elt = t[i]
        s = elt.innerText || elt.textContent
        x = s.length - options.maxStringLength
        if (0 < x) {
          h = elt.innerHTML
          elt[elt.innerText ? 'innerText' : 'textContent'] = s.substring(0, options.maxStringLength)
          elt.className += ' sf-dump-str-collapse'
          elt.innerHTML =
            '<span class=sf-dump-str-collapse>' +
            h +
            '<a class="sf-dump-ref sf-dump-str-toggle" title="Collapse"> ' +
            icons.strCollapse +
            '</a></span>' +
            '<span class=sf-dump-str-expand>' +
            elt.innerHTML +
            '<a class="sf-dump-ref sf-dump-str-toggle" title="' +
            x +
            ' remaining characters"> ' +
            icons.strExpand +
            '</a></span>'
        }
      }
    } catch (e) {}
  }
}
