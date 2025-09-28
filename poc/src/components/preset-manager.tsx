import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'preset-manager',
  styleUrl: 'preset-manager.css',
  shadow: true
})
export class PresetManager {
  @State() presets = [
    { category: 'Shopping', subcategory: 'Groceries', amount: 200 },
    { category: 'Utilities', subcategory: 'Electric', amount: 80 }
  ];

  render() {
    return (
      <div>
        <h2>Manage Recurring Budget Presets</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {this.presets.map(preset => (
              <tr>
                <td>{preset.category}</td>
                <td>{preset.subcategory}</td>
                <td>${preset.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{marginTop: '1em', color: '#888'}}>This is a StencilJS micro-frontend POC.</p>
      </div>
    );
  }
}
