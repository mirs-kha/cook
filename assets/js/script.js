document.addEventListener('DOMContentLoaded', () => {
    const seasonSwitchButton = document.getElementById('season-switch');
    const refreshButton = document.getElementById('refresh-button');
    const printButton = document.getElementById('print-button');
    const namesButton = document.getElementById('names-button');
    const seasonIndicator = document.getElementById('seasonIndicator');
    const lunchRecipesRow = document.getElementById('lunchRecipesRow');
    const dinnerRecipesRow = document.getElementById('dinnerRecipesRow');
    const listRepas = document.getElementById('list-repas');

    let lunchRecipesList = [];
    let dinnerRecipesList = [];
    let remainingLunchRecipes = [];
    let remainingDinnerRecipes = [];
    let currentSeason = ''; // Default to all recipes
    let allRecipes = [];

    function getRandomWeightedRecipe(recipes) {
        const weightedRecipes = recipes.map(recipe => ({
            recipe,
            weight: recipe.frequence === 'souvent' ? 2 : 1
        }));

        const totalWeight = weightedRecipes.reduce((sum, { weight }) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const { recipe, weight } of weightedRecipes) {
            if (random < weight) return recipe;
            random -= weight;
        }
    }

    function getRandomRecipes(recipes, count) {
        const selectedRecipes = [];
        const availableRecipes = [...recipes];

        while (selectedRecipes.length < count && availableRecipes.length > 0) {
            const recipe = getRandomWeightedRecipe(availableRecipes);
            selectedRecipes.push(recipe);
            const index = availableRecipes.indexOf(recipe);
            availableRecipes.splice(index, 1);
        }

        return selectedRecipes;
    }

    function displayRecipes(recipes, recipesRow) {
        recipesRow.innerHTML = '';

        recipes.forEach((recipe, index) => {
            const recipeCell = document.createElement('td');
            recipeCell.innerHTML = `
                <h3>${recipe.name}</h3>
                <div class="image-container">
                    <img src="${recipe.imageURL}" alt="${recipe.name}">
                </div>
                <button class="remove-button" data-index="${index}">Supprimer</button>
            `;
            recipesRow.appendChild(recipeCell);
        });

        // Fill the remaining days with empty cells if less than 7 recipes
        const remainingDays = 7 - recipes.length;
        for (let i = 0; i < remainingDays; i++) {
            const emptyCell = document.createElement('td');
            emptyCell.innerHTML = `<h3>Pas de recette</h3>`;
            recipesRow.appendChild(emptyCell);
        }
    }

    function removeRecipe(event) {
        const button = event.target;
        const index = button.getAttribute('data-index');
        const isLunchTable = button.closest('tbody').id === 'lunchRecipesRow';
        const remainingRecipes = isLunchTable ? remainingLunchRecipes : remainingDinnerRecipes;
        const recipesList = isLunchTable ? lunchRecipesList : dinnerRecipesList;

        if (remainingRecipes.length === 0) {
            alert('Plus de recettes disponibles pour remplacer.');
            return;
        }

        const newRecipe = getRandomWeightedRecipe(remainingRecipes);
        recipesList[index] = newRecipe;
        const newIndex = remainingRecipes.indexOf(newRecipe);
        remainingRecipes.splice(newIndex, 1);

        displayRecipes(recipesList, document.getElementById(isLunchTable ? 'lunchRecipesRow' : 'dinnerRecipesRow'));
    }

    function switchSeason() {
        if (currentSeason === '') {
            currentSeason = 'ete';
        } else if (currentSeason === 'ete') {
            currentSeason = 'hiver';
        } else {
            currentSeason = '';
        }

        let seasonText = 'Toutes';
        if (currentSeason === 'ete') {
            seasonText = 'Été';
        } else if (currentSeason === 'hiver') {
            seasonText = 'Hiver';
        }

        seasonIndicator.innerText = `Saison actuelle : ${seasonText}`;
        loadSeasonRecipes();
    }

    function loadSeasonRecipes() {
        const seasonRecipes = currentSeason === '' ? allRecipes : allRecipes.filter(recipe => recipe.saison === currentSeason || recipe.saison === '');

        remainingLunchRecipes = seasonRecipes.filter(recipe => recipe.repas === 'midi');
        remainingDinnerRecipes = seasonRecipes.filter(recipe => recipe.repas === 'soir');

        lunchRecipesList = getRandomRecipes(remainingLunchRecipes, 7);
        dinnerRecipesList = getRandomRecipes(remainingDinnerRecipes, 7);

        displayRecipes(lunchRecipesList, lunchRecipesRow);
        displayRecipes(dinnerRecipesList, dinnerRecipesRow);
    }

    function printTable() {
        const lunchTable = lunchRecipesRow.closest('table').outerHTML;
        const dinnerTable = dinnerRecipesRow.closest('table').outerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = lunchTable + dinnerTable;
        window.print();
        document.body.innerHTML = originalContents;

        attachEventHandlers();
    }

    function printRecipeNames() {
        listRepas.innerHTML = ''; // Clear the list first

        const sortedRecipes = [...allRecipes].sort((a, b) => a.name.localeCompare(b.name));
        sortedRecipes.forEach(recipe => {
            const nameElement = document.createElement('p');
            nameElement.textContent = recipe.name;
            listRepas.appendChild(nameElement);
        });
    }

    function attachEventHandlers() {
        seasonSwitchButton.addEventListener('click', switchSeason);
        refreshButton.addEventListener('click', () => window.location.reload());
        printButton.addEventListener('click', printTable);
        namesButton.addEventListener('click', printRecipeNames);

        // Attach remove event handlers
        document.querySelectorAll('.remove-button').forEach(button => {
            button.addEventListener('click', removeRecipe);
        });
    }

    fetch('assets/js/file.json')
        .then(response => response.json())
        .then(data => {
            allRecipes = data;
            loadSeasonRecipes();
            attachEventHandlers();
        })
        .catch(error => console.error('Erreur lors du chargement des recettes:', error));
});
