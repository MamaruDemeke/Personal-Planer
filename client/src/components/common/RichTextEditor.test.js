import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RichTextEditor from './RichTextEditor.vue'

function mountEditor(html = '') {
  return mount(RichTextEditor, {
    props: { modelValue: html },
    attachTo: document.body,
  })
}

function editorOf(wrapper) {
  return wrapper.element.querySelector('[contenteditable="true"]')
}

function selectAll(wrapper) {
  const editor = editorOf(wrapper)
  const range = document.createRange()
  range.selectNodeContents(editor)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

function clickButton(wrapper, title) {
  const button = wrapper.element.querySelector(`button[title="${title}"]`)
  expect(button, `button "${title}" should exist`).toBeTruthy()
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('RichTextEditor lists', () => {
  it('turns the selected text into a numbered list and keeps the text', async () => {
    const wrapper = mountEditor('<p>first</p><p>second</p>')
    await wrapper.vm.$nextTick()

    selectAll(wrapper)
    clickButton(wrapper, 'Numbered list')

    const html = editorOf(wrapper).innerHTML
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>first</li>')
    expect(html).toContain('<li>second</li>')
    // No stray empty item: the caret lands after the number so the user can type.
    expect(editorOf(wrapper).querySelectorAll('li')).toHaveLength(2)
  })

  it('turns the selected text into a bullet list', async () => {
    const wrapper = mountEditor('<p>alpha</p>')
    await wrapper.vm.$nextTick()

    selectAll(wrapper)
    clickButton(wrapper, 'Bullet list')

    const html = editorOf(wrapper).innerHTML
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>alpha</li>')
  })

  it('switches an existing bullet list into a numbered list', async () => {
    const wrapper = mountEditor('<ul><li>one</li><li>two</li></ul>')
    await wrapper.vm.$nextTick()

    selectAll(wrapper)
    clickButton(wrapper, 'Numbered list')

    const html = editorOf(wrapper).innerHTML
    expect(html).not.toContain('<ul>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>two</li>')
  })

  it('toggles a list back to plain paragraphs', async () => {
    const wrapper = mountEditor('<ul><li>one</li></ul>')
    await wrapper.vm.$nextTick()

    selectAll(wrapper)
    clickButton(wrapper, 'Bullet list')

    const html = editorOf(wrapper).innerHTML
    expect(html).not.toContain('<ul>')
    expect(html).toContain('<p>one</p>')
  })
})

describe('RichTextEditor Word-like lists', () => {
  function caretAt(node, offset) {
    const range = document.createRange()
    range.setStart(node, offset)
    range.collapse(true)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function pressEnter(wrapper) {
    editorOf(wrapper).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
  }

  it('creates a single empty numbered item when the editor is empty', async () => {
    const wrapper = mountEditor('')
    await wrapper.vm.$nextTick()

    clickButton(wrapper, 'Numbered list')

    const editor = editorOf(wrapper)
    expect(editor.querySelectorAll('ol li')).toHaveLength(1)
    expect(editor.querySelector('ol li').innerHTML).toBe('<br>')
  })

  it('Enter continues the numbering in a new item', async () => {
    const wrapper = mountEditor('<ol><li>one</li></ol>')
    await wrapper.vm.$nextTick()

    const first = editorOf(wrapper).querySelector('li')
    caretAt(first.firstChild, first.firstChild.length)
    pressEnter(wrapper)
    await wrapper.vm.$nextTick()

    const items = editorOf(wrapper).querySelectorAll('ol li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('one')
    expect(items[1].innerHTML).toBe('<br>')
  })

  it('Enter on the last empty item ends the list', async () => {
    const wrapper = mountEditor('<ol><li>one</li><li><br></li></ol>')
    await wrapper.vm.$nextTick()

    const items = editorOf(wrapper).querySelectorAll('li')
    caretAt(items[1], 0)
    pressEnter(wrapper)
    await wrapper.vm.$nextTick()

    const editor = editorOf(wrapper)
    expect(editor.querySelectorAll('ol li')).toHaveLength(1)
    expect(editor.querySelector('ol').nextElementSibling?.tagName).toBe('P')
  })
})

describe('RichTextEditor gap', () => {  it('keeps the numbering continuous across a gap', async () => {
    const wrapper = mountEditor('<ol><li>one</li><li>two</li><li>three</li></ol>')
    await wrapper.vm.$nextTick()

    const editor = editorOf(wrapper)
    const second = editor.querySelectorAll('li')[1]
    const range = document.createRange()
    range.selectNodeContents(second)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    clickButton(wrapper, 'Gap (space between items)')

    const lists = editor.querySelectorAll('ol')
    expect(lists).toHaveLength(2)
    expect(lists[0].querySelectorAll('li')).toHaveLength(2)
    expect(lists[1].querySelectorAll('li')).toHaveLength(1)
    // The second half continues the numbering instead of restarting at 1.
    expect(lists[1].getAttribute('start')).toBe('3')
    expect(editor.innerHTML).toContain('margin:14px 0')
  })
})
