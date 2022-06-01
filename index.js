import express from 'express';
import Pokedex from 'pokedex-promise-v2';
import fs from 'fs/promises';
import axios from 'axios';
import { version } from 'os';

const app = express();
const port = 8008;
const pokedex = new Pokedex();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    next();
})

app.get('/pokemon/', async (req, res) => {
    let pokemonList = [];

    for (let i = 1; i < 152; i++) {
        pokemonList.push(await readPokemonData(i));
    }

    res.send(pokemonList);

})

app.get('/pokemon/:id', async (req, res) => {
    let pokemon = await readPokemonData(req.params.id);

    res.send(pokemon);
});

app.get('/encounters', (req, res) => {
    getPokemonEncounters(40).then(data => res.send(data))
})

app.get('/setupdata', async (req, res) => {
    for (let i = 1; i < 152; i++) {
        writePokemonData(i);
    }
    console.log('setup successful')
});

app.get('/catch/:id', async (req, res, next) => {
    try{
        let pokemon = await readPokemonData(req.params.id);

        if (pokemon.caught) pokemon.caught = 0;
        else pokemon.caught = 1;

        fs.writeFile(`data/pokemon/${pokemon.id}.json`, JSON.stringify(pokemon), (err) => {
            if(err) console.log(err)
        })

        console.log(`${pokemon.name} caught!`);
        res.send(pokemon);
    }
    catch (error){
        next(error);
    }
})

app.listen(port, () => {
    console.log("UwU")
});


const writePokemonData = async (pokeID) => {

    const pokemonData = await getPokemonData(pokeID);
    const pokemonEncounters = await getPokemonEncounters(pokeID);

    const types = parseTypes(pokemonData.types);

    const pokemon = {
        "id" : pokemonData.id,
        "name" : pokemonData.name,
        "types" : types,
        "versions" : pokemonEncounters,
        "caught" : 0
    }

    fs.writeFile(`data/pokemon/${pokemon.id}.json`, JSON.stringify(pokemon), (err) => {
        if(err) console.log(err)
    })

    console.log(`pokemon ${pokemon.id} written successfully`);
    return pokemon;
}

const readPokemonData = async (pokeID) => {
    try {
        const data = await fs.readFile(`data/pokemon/${pokeID}.json`, { encoding: "utf-8" });
        return JSON.parse(data);
    }
    catch (err) {
        const data = writePokemonData(pokeID)
        return data;
    };
}

const getPokemonEncounters = async (pokeID) => {
    try {
        let versionList = [];

        await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeID}/encounters`)
             .then(response => {
                 response.data.forEach( location=> {
                     location.version_details.forEach( version => {
                         versionList.push(version.version.name);
                     })
                 });
                 versionList = [...new Set(versionList)];
            });

        if (versionList.length === 0) {
            versionList.push("Evolution");
        }

        return versionList;
    }
    catch (err) {
        console.log(err)
    }
}

const getPokemonData = async (pokeID) => {
    try {
        let pokemonData = await pokedex.getPokemonByName(pokeID);
        return pokemonData;
    } 
    catch (error) {
        console.log(error);    
    }
}

const parseTypes = (typesArray) => {
    try {
        let types = [];

        typesArray.forEach(type => {
            types.push(type.type.name);
        })

        return types;
    }
    catch {
        console.log(error);
    }
}