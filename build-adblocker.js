// build-adblocker.js - VERSÃO CORRIGIDA

const fs = require('fs');
const path = require('path');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch'); // ✅ ESTA É A LINHA ADICIONADA

// Lista de filtros que queremos usar.
const FILTER_LIST_URLS = [
    'https://easylist.to/easylist/easylist.txt',
    'https://easylist.to/easylist/easyprivacy.txt',
    'https://easylist-downloads.adblockplus.org/easylistportuguese.txt',
    'https://easylist.to/easylist/fanboy-annoyance.txt',
    'https://easylist.to/easylist/fanboy-social.txt',
];

async function buildAdBlocker() {
    console.log('Iniciando construção do motor de bloqueio...');
    
    try {
        // A biblioteca vai baixar as listas e criar o motor
        const blocker = await ElectronBlocker.fromLists(fetch, FILTER_LIST_URLS);
        console.log('Listas de filtros baixadas e processadas.');

        // Serializa o motor em um formato binário super rápido
        const buffer = blocker.serialize();

        // Salva o motor no arquivo que nosso navegador vai usar
        fs.writeFileSync(path.join(__dirname, 'adblocker-engine.bin'), buffer);
        
        console.log('Motor de bloqueio (`adblocker-engine.bin`) criado com sucesso!');
    } catch (error) {
        console.error('Ocorreu um erro ao construir o motor de bloqueio:', error);
    }
}

buildAdBlocker();