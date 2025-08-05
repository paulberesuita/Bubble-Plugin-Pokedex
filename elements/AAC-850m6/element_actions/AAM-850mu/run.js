function(instance, properties, context) {
    const pokemonName = properties.pokemonName;

    return fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`)
        .then(response => response.json())
        .then(speciesData => {
            return fetch(speciesData.evolution_chain.url);
        })
        .then(response => response.json())
        .then(evolutionData => {
            let stage = "basic";
            let chain = evolutionData.chain;
            
            function findPokemonInChain(chain, name, depth = 0) {
                if (chain.species.name === name.toLowerCase()) {
                    return depth;
                }
                for (let evo of chain.evolves_to) {
                    let result = findPokemonInChain(evo, name, depth + 1);
                    if (result !== -1) return result;
                }
                return -1;
            }

            let evolutionStage = findPokemonInChain(chain, pokemonName);
            
            if (evolutionStage === 1) stage = "stage 1";
            else if (evolutionStage >= 2) stage = "stage 2";

            return fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
                .then(response => response.json())
                .then(data => {
                    // Find the HP stat
                    const hpStat = data.stats.find(stat => stat.stat.name === 'hp');
                    const pokemonHP = hpStat ? hpStat.base_stat : 0;

                    // Get Pokemon types
                    const pokemonTypes = data.types.map(type => type.type.name);
                    const pokemonType = pokemonTypes.join('/');

                    // Get Pokemon attacks (moves)
                    const pokemonAttacks = data.moves.map(move => move.move.name).join(', ');

                    // Get Pokemon ID (National Pokédex number)
                    const pokemonID = data.id;

                    // Set plugin states
                    instance.publishState('pokemonName', data.name);
                    instance.publishState('pokemonImage', data.sprites.other['official-artwork'].front_default);
                    instance.publishState('pokemonStage', stage);
                    instance.publishState('pokemonHP', pokemonHP);
                    instance.publishState('pokemonType', pokemonType);
                    instance.publishState('pokemonAttacks', pokemonAttacks);
                    instance.publishState('pokemonID', pokemonID);

                    // Trigger the getPokemon event
                    instance.triggerEvent('getPokemon');
                });
        })
        .catch(error => {
            console.error('Error fetching Pokemon:', error);
            instance.triggerEvent('noPokemonFound');
        });
}