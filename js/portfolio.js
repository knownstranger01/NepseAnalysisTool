document.addEventListener('DOMContentLoaded', function() {
    // पोर्टफोलियो वितरण चार्ट
    const portfolioDistributionCtx = document.getElementById('portfolio-distribution');
    if (portfolioDistributionCtx) {
        const portfolioDistributionChart = new Chart(portfolioDistributionCtx, {
            type: 'pie',
            data: {
                labels: ['NABIL', 'NHPC', 'NTC', 'NRIC', 'ADBL', 'NICA', 'GBIME', 'NIFRA'],
                datasets: [{
                    data: [105000, 96000, 95000, 50000, 45000, 42000, 52000, 40000],
                    backgroundColor: [
                        '#4285F4', '#34A853', '#FBBC05', '#EA4335',
                        '#1A73E8', '#0F9D58', '#F4B400', '#DB4437'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: रु. ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // क्षेत्र अनुसार वितरण चार्ट
    const sectorDistributionCtx = document.getElementById('sector-distribution');
    if (sectorDistributionCtx) {
        const sectorDistributionChart = new Chart(sectorDistributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['बैंकिङ', 'हाइड्रोपावर', 'टेलिकम', 'बीमा', 'लघुवित्त', 'अन्य'],
                datasets: [{
                    data: [239000, 146000, 95000, 50000, 45000, 0],
                    backgroundColor: [
                        '#4285F4', '#34A853', '#FBBC05', '#EA4335',
                        '#1A73E8', '#0F9D58'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: रु. ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // शेयर थप्ने मोडल
    const addStockBtn = document.getElementById('add-stock-btn');
    const addStockModal = document.getElementById('add-stock-modal');
    const closeModal = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const addStockForm = document.getElementById('add-stock-form');

    if (addStockBtn && addStockModal) {
        // मोडल खोल्ने
        addStockBtn.addEventListener('click', function() {
            addStockModal.style.display = 'block';
        });

        // मोडल बन्द गर्ने
        if (closeModal) {
            closeModal.addEventListener('click', function() {
                addStockModal.style.display = 'none';
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                addStockModal.style.display = 'none';
            });
        }

        // बाहिर क्लिक गर्दा मोडल बन्द गर्ने
        window.addEventListener('click', function(e) {
            if (e.target === addStockModal) {
                addStockModal.style.display = 'none';
            }
        });

        // फर्म सबमिट
        if (addStockForm) {
            addStockForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const symbol = document.getElementById('stock-symbol').value;
                const buyPrice = document.getElementById('buy-price').value;
                const quantity = document.getElementById('quantity').value;
                const buyDate = document.getElementById('buy-date').value;
                
                console.log('नयाँ शेयर थप्ने:', { symbol, buyPrice, quantity, buyDate });
                
                // डेमोको लागि अलर्ट देखाउने
                alert('शेयर सफलतापूर्वक थपियो! (डेमो मात्र)');
                
                // मोडल बन्द गर्ने
                addStockModal.style.display = 'none';
                
                // फर्म रिसेट गर्ने
                addStockForm.reset();
            });
        }
    }

    // शेयर सम्पादन र मेटाउने बटनहरू
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const symbol = row.querySelector('.symbol').textContent;
            
            console.log('शेयर सम्पादन:', symbol);
            
            // डेमोको लागि अलर्ट देखाउने
            alert(`${symbol} सम्पादन गर्न चाहनुहुन्छ। (डेमो मात्र)`);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const symbol = row.querySelector('.symbol').textContent;
            
            console.log('शेयर मेटाउने:', symbol);
            
            // डेमोको लागि अलर्ट देखाउने
            const confirm = window.confirm(`के तपाईं ${symbol} मेटाउन निश्चित हुनुहुन्छ?`);
            
            if (confirm) {
                alert(`${symbol} सफलतापूर्वक मेटाइयो। (डेमो मात्र)`);
            }
        });
    });

    // एक्सपोर्ट बटन
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log('पोर्टफोलियो एक्सपोर्ट गर्ने');
            
            // डेमोको लागि अलर्ट देखाउने
            alert('पोर्टफोलियो एक्सपोर्ट गरिँदैछ... (डेमो मात्र)');
        });
    }
}); 