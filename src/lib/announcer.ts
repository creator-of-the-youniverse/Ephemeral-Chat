/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized Screen Reader Live Region Announcer
 * Delivers immediate spoken announcements to VoiceOver, NVDA, JAWS, and TalkBack.
 */

type AnnouncementPriority = 'polite' | 'assertive';

let politeNode: HTMLElement | null = null;
let assertiveNode: HTMLElement | null = null;

function ensureAnnouncerNodes(): { polite: HTMLElement; assertive: HTMLElement } | null {
  if (typeof document === 'undefined') return null;

  if (!politeNode || !document.body.contains(politeNode)) {
    politeNode = document.createElement('div');
    politeNode.id = 'sr-announcer-polite';
    politeNode.setAttribute('role', 'status');
    politeNode.setAttribute('aria-live', 'polite');
    politeNode.setAttribute('aria-atomic', 'true');
    politeNode.className = 'sr-only';
    document.body.appendChild(politeNode);
  }

  if (!assertiveNode || !document.body.contains(assertiveNode)) {
    assertiveNode = document.createElement('div');
    assertiveNode.id = 'sr-announcer-assertive';
    assertiveNode.setAttribute('role', 'alert');
    assertiveNode.setAttribute('aria-live', 'assertive');
    assertiveNode.setAttribute('aria-atomic', 'true');
    assertiveNode.className = 'sr-only';
    document.body.appendChild(assertiveNode);
  }

  return { polite: politeNode, assertive: assertiveNode };
}

/**
 * Announce text to screen readers.
 * 'assertive' interrupts immediately (useful for door knocks, alarms, room destruction).
 * 'polite' announces as soon as the user finishes their current reading stream.
 */
export function announce(message: string, priority: AnnouncementPriority = 'polite'): void {
  const nodes = ensureAnnouncerNodes();
  if (!nodes || !message.trim()) return;

  const targetNode = priority === 'assertive' ? nodes.assertive : nodes.polite;

  // Clear previous announcement to guarantee screen readers trigger on duplicate phrases
  targetNode.textContent = '';

  // Use requestAnimationFrame / timeout to ensure browser fires DOM mutation event
  setTimeout(() => {
    targetNode.textContent = message.trim();
  }, 50);
}
