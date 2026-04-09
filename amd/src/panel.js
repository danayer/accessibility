// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Default script for accessibility panel
 *
 * @module      local/accessibility
 * @copyright   2023 Ponlawat Weerapanpisit <ponlawat_w@outlook.co.th>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import $ from 'jquery';

const STORAGE_KEY = 'local_accessibility_button_pos';

/**
 * Position panel near the button container
 * @param {jQuery} $buttonContainer
 * @param {jQuery} $panel
 */
const updatePanelPosition = ($buttonContainer, $panel) => {
    const rect = $buttonContainer[0].getBoundingClientRect();
    const panelWidth = $panel.outerWidth() || 400;
    const panelHeight = $panel.outerHeight() || 300;
    const windowWidth = window.innerWidth;

    let left = rect.left;
    let top = rect.top - panelHeight - 10;

    if (left + panelWidth > windowWidth) {
        left = windowWidth - panelWidth - 10;
    }
    if (left < 0) {
        left = 10;
    }
    if (top < 0) {
        top = rect.bottom + 10;
    }

    $panel.css({
        left: left + 'px',
        top: top + 'px',
        right: 'unset',
        bottom: 'unset'
    });
};

/**
 * Clamp a value within [min, max]
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Initialise accessibility panel
 */
export const init = () => {
    $(() => {
        const $buttonContainer = $('#local-accessibility-buttoncontainer');
        const $button = $buttonContainer.find('button');
        const $panel = $('.local-accessibility-panel');
        const $closebtn = $('#local-accessibility-closebtn');

        if (!$button.length || !$panel.length) {
            return;
        }

        $panel.hide();

        // Restore saved button position
        const savedPos = localStorage.getItem(STORAGE_KEY);
        if (savedPos) {
            try {
                const pos = JSON.parse(savedPos);
                const btnW = $buttonContainer.outerWidth() || 40;
                const btnH = $buttonContainer.outerHeight() || 40;
                const left = clamp(parseFloat(pos.left), 0, window.innerWidth - btnW);
                const top = clamp(parseFloat(pos.top), 0, window.innerHeight - btnH);
                $buttonContainer.css({
                    top: top + 'px',
                    left: left + 'px',
                    right: 'unset',
                    bottom: 'unset'
                });
            } catch (e) {
                // Use default CSS position
            }
        }

        // Drag functionality (mouse and touch)
        let isDragging = false;

        const startDrag = (startX, startY) => {
            const rect = $buttonContainer[0].getBoundingClientRect();
            const btnStartLeft = rect.left;
            const btnStartTop = rect.top;
            isDragging = false;

            const moveDrag = (clientX, clientY) => {
                const dx = clientX - startX;
                const dy = clientY - startY;
                if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                    isDragging = true;
                }
                if (isDragging) {
                    const btnW = $buttonContainer.outerWidth() || 40;
                    const btnH = $buttonContainer.outerHeight() || 40;
                    const newLeft = clamp(btnStartLeft + dx, 0, window.innerWidth - btnW);
                    const newTop = clamp(btnStartTop + dy, 0, window.innerHeight - btnH);
                    $buttonContainer.css({
                        left: newLeft + 'px',
                        top: newTop + 'px',
                        right: 'unset',
                        bottom: 'unset'
                    });
                    if ($panel.css('display') !== 'none') {
                        updatePanelPosition($buttonContainer, $panel);
                    }
                }
            };

            const endDrag = () => {
                if (isDragging) {
                    const finalRect = $buttonContainer[0].getBoundingClientRect();
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        top: finalRect.top + 'px',
                        left: finalRect.left + 'px'
                    }));
                }
                isDragging = false;
            };

            return {moveDrag, endDrag};
        };

        $buttonContainer.on('mousedown', (e) => {
            const {moveDrag, endDrag} = startDrag(e.clientX, e.clientY);

            const onMouseMove = (moveEvent) => moveDrag(moveEvent.clientX, moveEvent.clientY);
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                endDrag();
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        $buttonContainer.on('touchstart', (e) => {
            const touch = e.originalEvent.touches[0];
            const {moveDrag, endDrag} = startDrag(touch.clientX, touch.clientY);

            const onTouchMove = (moveEvent) => {
                const t = moveEvent.touches[0];
                moveDrag(t.clientX, t.clientY);
                if (isDragging) {
                    moveEvent.preventDefault();
                }
            };
            const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                endDrag();
            };

            document.addEventListener('touchmove', onTouchMove, {passive: false});
            document.addEventListener('touchend', onTouchEnd);
        });

        $button.on('click', () => {
            if (isDragging) {
                return;
            }
            if ($panel.css('display') === 'none') {
                updatePanelPosition($buttonContainer, $panel);
                $panel.show();
            } else {
                $panel.hide();
            }
        });

        window.addEventListener('click', e => {
            if ($buttonContainer[0].contains(e.target) || $panel[0].contains(e.target)) {
                return;
            }
            if ($panel.css('display') !== 'none') {
                $panel.hide();
            }
        });

        window.addEventListener('keyup', e => {
            if ($panel.css('display') !== 'none' && e.key === 'Escape') {
                $panel.hide();
            }
        });

        if ($closebtn.length) {
            $closebtn.on('click', () => {
                $panel.hide();
            });
        }
    });
};
