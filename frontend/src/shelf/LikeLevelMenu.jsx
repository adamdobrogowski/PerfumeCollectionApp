import { Button, Menu } from '@mantine/core'
import { LIKE_LEVELS } from './shelfState.js'

function LevelDots({ strength }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3].map((position) => (
        <span
          key={position}
          style={{
            width: 7,
            height: 7,
            boxSizing: 'border-box',
            borderRadius: '50%',
            border: '1.5px solid currentColor',
            backgroundColor: position <= strength ? 'currentColor' : 'transparent',
          }}
        />
      ))}
    </span>
  )
}

function LikeLevelMenu({ strength, disabled, onSelect, onRemove }) {
  const currentLabel = LIKE_LEVELS.find((level) => level.strength === strength)?.label

  return (
    <Menu position="bottom-start" width={200}>
      <Menu.Target>
        <Button variant="light" size="sm" disabled={disabled} aria-label={`Lubię, poziom: ${currentLabel}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Lubię
            <LevelDots strength={strength} />
            <span aria-hidden="true">▾</span>
          </span>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {LIKE_LEVELS.map((level) => (
          <Menu.Item
            key={level.strength}
            rightSection={level.strength === strength ? '✓' : null}
            onClick={() => level.strength !== strength && onSelect(level.strength)}
          >
            {level.label}
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item onClick={onRemove}>Usuń z Lubianych</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export default LikeLevelMenu