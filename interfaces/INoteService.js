// src/interfaces/INoteService.js

export class INoteService {
  connect() {
    throw new Error('Method not implemented.');
  }

  createOrUpdatePage(title, parentPageId) {
    throw new Error('Method not implemented.');
  }

  updatePageContent(pageId, contentBlocks) {
    throw new Error('Method not implemented.');
  }

  getPageContent(pageId) {
    throw new Error('Method not implemented.');
  }

  appendPageBlocks(pageId, blocks) {
    throw new Error('Method not implemented.');
  }

  clearPageBlocks(pageId) {
    throw new Error('Method not implemented.');
  }

  searchNotionPage(pageName, parentPageId) {
    throw new Error('Method not implemented.');
  }
}