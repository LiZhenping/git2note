// src/interfaces/IGitService.js  

export class IGitService {  
  async connect() {  
    throw new Error('Method not implemented.');  
  }  

  async getRepositoryContents(path) {  
    throw new Error('Method not implemented.');  
  }  

  async getFileContent(filePath) {  
    throw new Error('Method not implemented.');  
  }  

  async hasAllowedFiles(dirPath, allowedExtensions) {  
    throw new Error('Method not implemented.');  
  }  
}