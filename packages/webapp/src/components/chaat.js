// Import { LitElement, html } from 'lit';
// import { loadMessages, saveMessages, clearMessages } from '../utils/chat-store.js';
// import './chat.css';

// export class ChatInterface extends LitElement {
//   static get properties() {
//     return {
//       messages: { type: Array },
//       inputMessage: { type: String },
//       isLoading: { type: Boolean },
//       isRetrieving: { type: Boolean },
//       ragEnabled: { type: Boolean },
//     };
//   }

//   constructor() {
//     super();
//     this.messages = [];
//     this.inputMessage = '';
//     this.isLoading = false;
//     this.isRetrieving = false;
//     this.ragEnabled = true;
//   }

//   createRenderRoot() {
//     return this; // Use light DOM to apply external CSS
//   }

//   connectedCallback() {
//     super.connectedCallback();
//     this.messages = loadMessages();
//   }

//   updated(changedProperties) {
//     if (changedProperties.has('messages')) {
//       saveMessages(this.messages);
//     }
//   }

//   render() {
//     return html`
//       <div class="chat-container">
//         <div class="chat-header">
//           <button class="clear-cache-btn" @click=${this._clearCache}>🧹Clear Chat</button>
//           <label class="rag-toggle">
//             <input type="checkbox" ?checked=${this.ragEnabled} @change=${this._toggleRag} />
//             Use Employee Handbook
//           </label>
//         </div>
//         <div class="chat-messages">
//           ${this.messages.map(
//             (message) => html`
//               <div class="message ${message.role === 'user' ? 'user-message' : 'ai-message'}">
//                 <div class="message-content">
//                   <span class="message-sender">${message.role === 'user' ? 'You' : 'AI'}</span>
//                   <p>${message.content}</p>
//                   ${message.sources && message.sources.length > 0
//                     ? html`
//                         <details class="sources">
//                           <summary>📚 Sources</summary>
//                           <div class="sources-content">${message.sources.map((source) => html`<p>${source}</p>`)}</div>
//                         </details>
//                       `
//                     : ''}
//                 </div>
//               </div>
//             `,
//           )}
//           ${this.isRetrieving
//             ? html`
//                 <div class="message system-message">
//                   <p>📚 Searching employee handbook...</p>
//                 </div>
//               `
//             : ''}
//           ${this.isLoading && !this.isRetrieving
//             ? html`
//                 <div class="message ai-message">
//                   <div class="message-content">
//                     <span class="message-sender">AI</span>
//                     <p>Thinking...</p>
//                   </div>
//                 </div>
//               `
//             : ''}
//         </div>
//         <div class="chat-input">
//           <input
//             type="text"
//             placeholder="Ask about company policies, benefits, etc..."
//             .value=${this.inputMessage}
//             @input=${this._handleInput}
//             @keyup=${this._handleKeyUp}
//           />
//           <button @click=${this._sendMessage} ?disabled=${this.isLoading || !this.inputMessage.trim()}>Send</button>
//         </div>
//       </div>
//     `;
//   }

//   _clearCache() {
//     clearMessages();
//     this.messages = [];
//   }

//   _handleInput(event) {
//     this.inputMessage = event.target.value;
//   }

//   _handleKeyUp(event) {
//     if (event.key === 'Enter' && this.inputMessage.trim() && !this.isLoading) {
//       this._sendMessage();
//     }
//   }

//   _toggleRag(event) {
//     this.ragEnabled = event.target.checked;
//   }

//   async _sendMessage() {
//     if (!this.inputMessage.trim() || this.isLoading) return;

//     const userMessage = {
//       role: 'user',
//       content: this.inputMessage,
//     };

//     this.messages = [...this.messages, userMessage];
//     const userQuery = this.inputMessage;
//     this.inputMessage = '';
//     this.isLoading = true;
//     this.isRetrieving = this.ragEnabled; // Show "Searching..." if RAG is enabled

//     try {
//       const response = await this._apiCall(userQuery);

//       this.messages = [
//         ...this.messages,
//         {
//           role: 'assistant',
//           content: response.reply,
//           sources: response.sources || [],
//         },
//       ];
//     } catch (error) {
//       console.error('Error:', error);
//       this.messages = [
//         ...this.messages,
//         {
//           role: 'assistant',
//           content: '❌ Sorry, something went wrong. Please try again.',
//         },
//       ];
//     } finally {
//       this.isLoading = false;
//       this.isRetrieving = false;
//     }
//   }

//   async _apiCall(message) {
//     const response = await fetch('http://localhost:3001/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         message,
//         useRAG: this.ragEnabled,
//       }),
//     });
//     const data = await response.json();
//     return data;
//   }
// }

// // 'window' is the global object in browsers that represents the browser window and provides access to the DOM, browser APIs, and global variables.
// // Here, we check if 'window' exists (to ensure the code runs only in a browser environment) and if 'window.customElements' is available (to register the custom element).
// if (typeof globalThis !== 'undefined' && globalThis.customElements) {
//   globalThis.customElements.define('chat-interface', ChatInterface);
// }
