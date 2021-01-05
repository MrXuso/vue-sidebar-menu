import { getCurrentInstance, computed, ref, inject } from 'vue'
import useMenu from './useMenu'
import { activeRecordIndex, isSameRouteLocationParams } from './useRouterLink'

const activeShow = ref(null)

export default function useItem (props) {
  const router = getCurrentInstance().appContext.config.globalProperties.$router
  const sidebarProps = inject('vsm-props')
  const emitItemClick = inject('emitItemClick')
  const emitScrollUpdate = inject('emitScrollUpdate')
  const { isCollapsed, mobileItem, setMobileItem, unsetMobileItem, currentRoute } = useMenu(sidebarProps)

  const itemShow = ref(false)
  const itemHover = ref(false)

  const active = computed(() => {
    return isLinkActive(props.item) || isChildActive(props.item.child)
  })

  const exactActive = computed(() => {
    return isLinkActive(props.item)
  })

  const isLinkActive = (item) => {
    if (!item.href || item.external) return false
    if (router) {
      const route = router.resolve(item.href)
      const routerCurrentRoute = router.currentRoute.value
      return activeRecordIndex(route, routerCurrentRoute) > -1 &&
        activeRecordIndex(route, routerCurrentRoute) === routerCurrentRoute.matched.length - 1 &&
        isSameRouteLocationParams(routerCurrentRoute.params, route.params)
    } else {
      return item.href === currentRoute.value
    }
  }

  const isChildActive = (child) => {
    if (!child) return false
    return child.some(item => {
      return isLinkActive(item) || isChildActive(item.child)
    })
  }

  const onRouteChange = () => {
    if (sidebarProps.showChild || props.isMobileItem) return
    if (active.value) {
      show.value = true
    }
  }

  const onLinkClick = (event) => {
    if (!props.item.href || props.item.disabled) {
      event.preventDefault()
      if (props.item.disabled) return
    }

    emitMobileItem(event, event.currentTarget.offsetParent)

    if (hasChild.value || !sidebarProps.showChild || !props.isMobileItem) {
      if (!props.item.href || exactActive.value) {
        show.value = !show.value
      }
    }

    emitItemClick(event, props.item)
  }

  const onMouseOver = (event) => {
    if (props.item.disabled) return
    event.stopPropagation()
    itemHover.value = true
    if (!sidebarProps.disableHover) {
      emitMobileItem(event, event.currentTarget)
    }
  }

  const onMouseOut = (event) => {
    event.stopPropagation()
    itemHover.value = false
  }

  const emitMobileItem = (event, itemEl) => {
    if (hover.value) return
    if (!isCollapsed.value || !isFirstLevel.value || props.isMobileItem) return
    unsetMobileItem()
    setTimeout(() => {
      if (mobileItem.value !== props.item) {
        setMobileItem({ item: props.item, itemEl })
      }
      if (event.type === 'click' && !hasChild.value) {
        unsetMobileItem(false)
      }
    }, 0)
  }

  const onExpandEnter = (el) => {
    el.style.height = el.scrollHeight + 'px'
  }

  const onExpandAfterEnter = (el) => {
    el.style.height = 'auto'
    if (!isCollapsed.value) {
      emitScrollUpdate()
    }
  }

  const onExpandBeforeLeave = (el) => {
    if (isCollapsed.value && isFirstLevel.value) {
      el.style.display = 'none'
      return
    }
    el.style.height = el.scrollHeight + 'px'
  }

  const onExpandAfterLeave = () => {
    if (!isCollapsed.value) {
      emitScrollUpdate()
    }
  }

  const show = computed({
    get: () => {
      if (!hasChild.value) return false
      if (sidebarProps.showChild || props.isMobileItem) return true
      return sidebarProps.showOneChild && isFirstLevel.value ? props.item === activeShow.value : itemShow.value
    },
    set: show => {
      if (sidebarProps.showOneChild && isFirstLevel.value) {
        show ? activeShow.value = props.item : activeShow.value = null
      }
      itemShow.value = show
    }
  })

  const hover = computed(() => {
    if (isCollapsed.value && isFirstLevel.value) {
      return props.item === mobileItem.value
    } else {
      return itemHover.value
    }
  })

  const isFirstLevel = computed(() => {
    return props.level === 1
  })

  const isHidden = computed(() => {
    if (isCollapsed.value) {
      if (props.item.hidden && props.item.hiddenOnCollapse === undefined) {
        return true
      } else {
        return props.item.hiddenOnCollapse === true
      }
    } else {
      return props.item.hidden === true
    }
  })

  const hasChild = computed(() => {
    return !!(props.item.child && props.item.child.length > 0)
  })

  const linkClass = computed(() => {
    return [
      'vsm--link',
      !props.isMobileItem ? `vsm--link_level-${props.level}` : '',
      { 'vsm--link_mobile': props.isMobileItem },
      { 'vsm--link_hover': hover.value },
      { 'vsm--link_active': active.value },
      { 'vsm--link_disabled': props.item.disabled },
      { 'vsm--link_open': show.value },
      props.item.class
    ]
  })

  const linkAttrs = computed(() => {
    const href = props.item.href ? props.item.href : '#'
    const target = props.item.external ? '_blank' : '_self'
    const tabindex = props.item.disabled ? -1 : null
    const ariaCurrent = exactActive.value ? 'page' : null

    return {
      href,
      target,
      tabindex,
      'aria-current': ariaCurrent,
      ...props.item.attributes
    }
  })

  const itemClass = computed(() => {
    return [
      'vsm--item',
      { 'vsm--item_mobile': props.isMobileItem }
    ]
  })

  return {
    active,
    exactActive,
    activeShow,
    show,
    hover,
    isFirstLevel,
    isHidden,
    hasChild,
    linkClass,
    linkAttrs,
    itemClass,
    onRouteChange,
    onLinkClick,
    onMouseOver,
    onMouseOut,
    onExpandEnter,
    onExpandAfterEnter,
    onExpandBeforeLeave,
    onExpandAfterLeave
  }
}
