import { Button, createButton } from '../Button';

describe('Button', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create a button with default options', () => {
      const button = new Button({ text: 'Click me' });
      const element = button.getElement();

      expect(element.tagName).toBe('BUTTON');
      expect(element.textContent).toBe('Click me');
      expect(element.classList.contains('btn')).toBe(true);
      expect(element.classList.contains('btn-primary')).toBe(true);
      expect(element.classList.contains('btn-medium')).toBe(true);
    });

    it('should create a link when href is provided', () => {
      const button = new Button({ 
        text: 'Link', 
        href: 'https://example.com',
        target: '_blank'
      });
      const element = button.getElement() as HTMLAnchorElement;

      expect(element.tagName).toBe('A');
      expect(element.href).toBe('https://example.com/');
      expect(element.target).toBe('_blank');
    });

    it('should apply custom variant and size', () => {
      const button = new Button({ 
        text: 'Secondary Small',
        variant: 'secondary',
        size: 'small'
      });
      const element = button.getElement();

      expect(element.classList.contains('btn-secondary')).toBe(true);
      expect(element.classList.contains('btn-small')).toBe(true);
    });

    it('should handle disabled state', () => {
      const button = new Button({ 
        text: 'Disabled',
        disabled: true
      });
      const element = button.getElement() as HTMLButtonElement;

      expect(element.disabled).toBe(true);
      expect(element.classList.contains('btn-disabled')).toBe(true);
      expect(element.style.opacity).toBe('0.6');
    });

    it('should render icon and text', () => {
      const icon = '<svg><path d="test"/></svg>';
      const button = new Button({ 
        text: 'With Icon',
        icon: icon
      });
      const element = button.getElement();

      expect(element.innerHTML).toContain(icon);
      expect(element.innerHTML).toContain('<span>With Icon</span>');
    });

    it('should add icon-only class when no text', () => {
      const button = new Button({ 
        icon: '<svg></svg>'
      });
      const element = button.getElement();

      expect(element.classList.contains('btn-icon-only')).toBe(true);
    });

    it('should set aria-label', () => {
      const button = new Button({ 
        icon: '<svg></svg>',
        ariaLabel: 'Close dialog'
      });
      const element = button.getElement();

      expect(element.getAttribute('aria-label')).toBe('Close dialog');
    });
  });

  describe('onClick handler', () => {
    it('should call onClick when clicked', async () => {
      const onClick = jest.fn();
      const button = new Button({ 
        text: 'Click me',
        onClick
      });
      const element = button.getElement();

      element.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle async onClick', async () => {
      const onClick = jest.fn().mockResolvedValue(undefined);
      const button = new Button({ 
        text: 'Async',
        onClick
      });
      const element = button.getElement();

      element.click();
      
      // Button should be in loading state
      expect(element.innerHTML).toContain('btn-spinner');
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Button should be back to normal
      expect(element.innerHTML).toContain('Async');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const onClick = jest.fn();
      const button = new Button({ 
        text: 'Disabled',
        disabled: true,
        onClick
      });
      const element = button.getElement();

      element.click();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const onClick = jest.fn();
      const button = new Button({ 
        text: 'Loading',
        loading: true,
        onClick
      });
      const element = button.getElement();

      element.click();

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('setLoading', () => {
    it('should toggle loading state', () => {
      const button = new Button({ text: 'Load' });
      const element = button.getElement() as HTMLButtonElement;

      button.setLoading(true);
      expect(element.disabled).toBe(true);
      expect(element.classList.contains('btn-loading')).toBe(true);
      expect(element.innerHTML).toContain('btn-spinner');

      button.setLoading(false);
      expect(element.disabled).toBe(false);
      expect(element.classList.contains('btn-loading')).toBe(false);
      expect(element.innerHTML).toContain('Load');
    });

    it('should preserve disabled state', () => {
      const button = new Button({ 
        text: 'Disabled Load',
        disabled: true
      });
      const element = button.getElement() as HTMLButtonElement;

      button.setLoading(true);
      expect(element.disabled).toBe(true);

      button.setLoading(false);
      expect(element.disabled).toBe(true);
    });
  });

  describe('setDisabled', () => {
    it('should toggle disabled state', () => {
      const button = new Button({ text: 'Toggle' });
      const element = button.getElement() as HTMLButtonElement;

      button.setDisabled(true);
      expect(element.disabled).toBe(true);
      expect(element.style.opacity).toBe('0.6');
      expect(element.style.cursor).toBe('not-allowed');

      button.setDisabled(false);
      expect(element.disabled).toBe(false);
      expect(element.style.opacity).toBe('1');
      expect(element.style.cursor).toBe('pointer');
    });
  });

  describe('setText', () => {
    it('should update button text', () => {
      const button = new Button({ text: 'Original' });
      const element = button.getElement();

      button.setText('Updated');
      expect(element.textContent).toBe('Updated');
    });

    it('should preserve icon when updating text', () => {
      const icon = '<svg></svg>';
      const button = new Button({ 
        text: 'Original',
        icon: icon
      });
      const element = button.getElement();

      button.setText('Updated');
      expect(element.innerHTML).toContain(icon);
      expect(element.innerHTML).toContain('Updated');
    });
  });

  describe('setIcon', () => {
    it('should update button icon', () => {
      const button = new Button({ text: 'Text' });
      const element = button.getElement();
      const newIcon = '<svg><circle/></svg>';

      button.setIcon(newIcon);
      expect(element.innerHTML).toContain(newIcon);
      expect(element.innerHTML).toContain('Text');
    });
  });

  describe('appendTo', () => {
    it('should append button to container', () => {
      const button = new Button({ text: 'Append' });
      
      button.appendTo(container);
      
      expect(container.children.length).toBe(1);
      expect(container.firstChild).toBe(button.getElement());
    });
  });

  describe('remove', () => {
    it('should remove button from DOM', () => {
      const button = new Button({ text: 'Remove' });
      button.appendTo(container);
      
      expect(container.children.length).toBe(1);
      
      button.remove();
      
      expect(container.children.length).toBe(0);
    });
  });

  describe('hover effects', () => {
    it('should apply hover effect on mouseenter', () => {
      const button = new Button({ text: 'Hover' });
      const element = button.getElement();

      element.dispatchEvent(new MouseEvent('mouseenter'));
      expect(element.style.filter).toBe('brightness(0.9)');
    });

    it('should remove hover effect on mouseleave', () => {
      const button = new Button({ text: 'Hover' });
      const element = button.getElement();

      element.dispatchEvent(new MouseEvent('mouseenter'));
      element.dispatchEvent(new MouseEvent('mouseleave'));
      expect(element.style.filter).toBe('');
    });

    it('should not apply hover effect when disabled', () => {
      const button = new Button({ 
        text: 'Disabled Hover',
        disabled: true
      });
      const element = button.getElement();

      element.dispatchEvent(new MouseEvent('mouseenter'));
      expect(element.style.filter).toBe('');
    });
  });

  describe('tooltip', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show tooltip on hover', () => {
      const button = new Button({ 
        text: 'Tooltip',
        tooltip: 'This is a tooltip',
        tooltipPosition: 'top'
      });
      const element = button.getElement();

      element.dispatchEvent(new MouseEvent('mouseenter'));
      
      const tooltip = document.querySelector('.btn-tooltip');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.textContent).toBe('This is a tooltip');
    });

    it('should hide tooltip on mouseleave', () => {
      const button = new Button({ 
        text: 'Tooltip',
        tooltip: 'This is a tooltip'
      });
      const element = button.getElement();

      element.dispatchEvent(new MouseEvent('mouseenter'));
      expect(document.querySelector('.btn-tooltip')).toBeTruthy();

      element.dispatchEvent(new MouseEvent('mouseleave'));
      jest.runAllTimers();
      
      expect(document.querySelector('.btn-tooltip')).toBeFalsy();
    });
  });

  describe('createButton helper', () => {
    it('should create a button instance', () => {
      const button = createButton({ text: 'Helper' });
      
      expect(button).toBeInstanceOf(Button);
      expect(button.getElement().textContent).toBe('Helper');
    });
  });
});