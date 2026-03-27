# Buggregator Frontend

## Storybook

### Запуск

```bash
yarn storybook   # или yarn sb
```

Storybook запускается на порту `6006`. Версия: **10.3.3**, фреймворк: **Vue 3 + Vite**.

### Конфигурация

| Файл                     | Назначение                                                             |
| ------------------------ | ---------------------------------------------------------------------- |
| `.storybook/main.ts`     | Основной конфиг: пути к stories, аддоны, алиасы Vite, env-переменные   |
| `.storybook/preview.ts`  | Глобальные декораторы, темы (light/dark), инициализация Pinia и Router |
| `.storybook/stories.css` | Фоновый паттерн для canvas                                             |

**Аддоны**: `addon-links`, `addon-docs`.

**Глобальный setup**: Pinia и Vue Router подключаются ко всем stories автоматически через `setup()` в `preview.ts`.

**Темы**: Доступны `light` и `dark` (по умолчанию) через Storybook Backgrounds. Декоратор в preview.ts переключает CSS-класс на `<html>`.

### Расположение файлов stories

Stories располагаются **рядом с компонентом** (collocated), файл называется `{component-name}.stories.ts`.

```
src/
├── shared/ui/
│   └── badge-number/
│       ├── badge-number.vue
│       └── badge-number.stories.ts      # title: "Shared/BadgeNumber"
├── entities/
│   └── ray/ui/
│       └── ray-page/
│           ├── ray-page.vue
│           └── ray-page.stories.ts       # title: "Screens/Ray/RayPage"
├── widgets/ui/
│   └── layout-sidebar/
│       ├── layout-sidebar.vue
│       └── layout-sidebar.stories.ts     # title: "Widgets/LayoutSidebar"
└── pages/
    └── login/ui/
        └── login-page/
            ├── login-page.vue
            └── login-page.stories.ts     # title: "Screens/Login/LoginPage"
```

### Иерархия title

| Слой FSD    | Формат title                                                               | Пример                      |
| ----------- | -------------------------------------------------------------------------- | --------------------------- |
| `shared/ui` | `Shared/{ComponentName}`                                                   | `"Shared/BadgeNumber"`      |
| `entities`  | `Screens/{Entity}/{ComponentName}` или `Entities/{Entity}/{ComponentName}` | `"Screens/Ray/RayPage"`     |
| `widgets`   | `Widgets/{ComponentName}`                                                  | `"Widgets/LayoutSidebar"`   |
| `pages`     | `Screens/{Page}/{ComponentName}`                                           | `"Screens/Login/LoginPage"` |

### Как писать stories

#### Минимальный пример

```typescript
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MyComponent from './my-component.vue'

export default {
  title: 'Shared/MyComponent',
  component: MyComponent
} as Meta<typeof MyComponent>

export const Default: StoryObj<typeof MyComponent> = {
  args: {
    label: 'Hello'
  }
}
```

#### Кастомный render (для слотов или обёрток)

```typescript
export default {
  title: 'Shared/BadgeNumber',
  component: BadgeNumber,
  render: (args) => ({
    setup() {
      return { args }
    },
    components: { BadgeNumber },
    template: `
      <BadgeNumber v-bind="args">
        <button>Button</button>
      </BadgeNumber>
    `
  })
} as Meta<typeof BadgeNumber>
```

#### Event handlers через actions

```typescript
import { action } from 'storybook/actions'

export default {
  title: 'Shared/PauseButton',
  component: PauseButton,
  argTypes: {
    onToggleUpdate: action('Toggle pause'),
    onDelete: action('Delete event')
  }
} as Meta<typeof PauseButton>
```

#### Select-контролы для enum/списков

```typescript
export default {
  title: 'Shared/PreviewCardHeader',
  component: PreviewCardHeader,
  argTypes: {
    eventType: {
      control: { type: 'select' },
      options: Object.values(EventTypes),
      mapping: EventTypes
    }
  }
} as Meta<typeof PreviewCardHeader>
```

#### Полноэкранные stories (для страниц)

```typescript
export default {
  title: 'Screens/Login/LoginPage',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen'
  }
} as Meta<typeof LoginPage>
```

#### Использование моков

```typescript
import { useRay } from '../../lib'
import { rayCallerMock } from '../../mocks'

const { normalizeRayEvent } = useRay()

export const Default: StoryObj<typeof RayPage> = {
  args: {
    event: normalizeRayEvent(rayCallerMock)
  }
}
```

### Иконки

В `main.ts` автоматически сканируется директория `src/shared/ui/icon-svg/icon-svg-originals` и все имена иконок передаются через env-переменную `STORYBOOK_ICON_SVG_NAMES`. В stories иконок используется:

```typescript
const iconNames = ((import.meta.env.STORYBOOK_ICON_SVG_NAMES as string) || '').split(',')
```

### Множественные варианты

Каждый экспорт из файла — отдельный вариант компонента:

```typescript
export const Default: StoryObj<typeof PauseButton> = {
  args: { isPaused: false, totalNewEventsCount: 10 }
}

export const Paused: StoryObj<typeof PauseButton> = {
  args: { isPaused: true, totalNewEventsCount: 10 }
}

export const Disabled: StoryObj<typeof PauseButton> = {
  args: { disabledPause: true, totalNewEventsCount: 0 }
}
```

### Чеклист при добавлении нового story

1. Файл `{component-name}.stories.ts` рядом с `.vue` файлом компонента
2. `title` соответствует слою FSD (см. таблицу выше)
3. Типизация: `Meta<typeof Component>` и `StoryObj<typeof Component>`
4. Как минимум один `Default` экспорт
5. Для страниц: `parameters: { layout: "fullscreen" }`
6. Для событий: `argTypes` с `action()` из `storybook/actions`
7. Для сложных данных: использовать моки из `mocks/` директории entity
