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
                $buttonContainer.css({
                    top: pos.top,
                    left: pos.left,
                    right: 'unset',
                    bottom: 'unset'
                });
            } catch (e) {
                // Use default CSS position
            }
        }

        // Drag functionality
        let isDragging = false;

        $buttonContainer.on('mousedown', (e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const rect = $buttonContainer[0].getBoundingClientRect();
            const btnStartLeft = rect.left;
            const btnStartTop = rect.top;
            isDragging = false;

            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                    isDragging = true;
                }
                if (isDragging) {
                    $buttonContainer.css({
                        left: (btnStartLeft + dx) + 'px',
                        top: (btnStartTop + dy) + 'px',
                        right: 'unset',
                        bottom: 'unset'
                    });
                    if ($panel.css('display') !== 'none') {
                        updatePanelPosition($buttonContainer, $panel);
                    }
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (isDragging) {
                    const finalRect = $buttonContainer[0].getBoundingClientRect();
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        top: finalRect.top + 'px',
                        left: finalRect.left + 'px'
                    }));
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
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
