function handleSearch(event) {
    event.preventDefault();
    const form = event.target;
    const searchData = new FormData(form);
    const params = new URLSearchParams();

    // Add query parameter if it exists and is not empty
    const query = searchData.get('query')?.trim();
    if (query) {
        params.append('query', query);
    }

    // Add category parameter only if a specific category is selected
    const category = searchData.get('category');
    if (category && category !== '') {
        params.append('category', category);
    }

    // Log the request URL for debugging
    console.log('Search URL:', `/inventory/search?${params}`);

    fetch(`/inventory/search?${params}`, {
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Search failed');
            });
        }
        return response.json();
    })
    .then(data => {
        const resultsDiv = document.getElementById('searchResults');
        if (data.results?.length > 0) {
            resultsDiv.innerHTML = generateSearchResultsHTML(data.results);
        } else {
            resultsDiv.innerHTML = '<p class="text-center text-gray-500">No items found</p>';
        }
    })
    .catch(error => {
        console.error('Search error:', error);
        document.getElementById('searchResults').innerHTML = 
            `<p class="text-center text-red-500">${error.message || 'Error performing search'}</p>`;
    });
}


function generateSearchResultsHTML(results) {
    return `
        <table class="min-w-full divide-y divide-orange-200">
            <thead class="bg-orange-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Location</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-orange-200">
                ${results.map(item => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${item.category}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${item.location}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${item.quantity || 1} ${item.unit || 'pieces'}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <a href="/items/${item.id}" class="text-blue-600 hover:text-blue-900 mr-4">View</a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
