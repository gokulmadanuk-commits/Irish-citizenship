import { describe, expect, it } from 'vitest'
import { containsAddress, containsPersonName, findDates, hasIslandOfIrelandAddress, hasNorthernIrelandPostcode } from '../textscan'

describe('reading documents', () => {
  it('finds UK style dates', () => {
    const found = findDates('Statement period 01/03/2024 to 31/03/2024').map((d) => d.iso)
    expect(found).toContain('2024-03-01')
    expect(found).toContain('2024-03-31')
  })

  it('finds written out dates', () => {
    expect(findDates('Issued 12 March 2024').map((d) => d.iso)).toContain('2024-03-12')
    expect(findDates('March 12, 2024').map((d) => d.iso)).toContain('2024-03-12')
  })

  it('spots a Northern Ireland postcode', () => {
    expect(hasNorthernIrelandPostcode('12 Example Road, Belfast BT9 5AA')).toBe(true)
    expect(hasNorthernIrelandPostcode('12 Example Road, Manchester M1 4BT')).toBe(false)
  })

  it('spots an Irish Eircode', () => {
    expect(hasIslandOfIrelandAddress('Dublin D02 XY45')).toBe(true)
  })

  it('matches a name even when the middle name is missing', () => {
    expect(containsPersonName('Account holder: ANNA SILVA', 'Anna Maria Silva')).toBe(true)
    expect(containsPersonName('Account holder: John Murphy', 'Anna Maria Silva')).toBe(false)
  })

  it('matches an address loosely', () => {
    expect(containsAddress('12 EXAMPLE ROAD BELFAST BT1 1AA', '12 Example Road\nBelfast\nBT1 1AA')).toBe(true)
    expect(containsAddress('9 Other Street, Cork', '12 Example Road\nBelfast\nBT1 1AA')).toBe(false)
  })
})
