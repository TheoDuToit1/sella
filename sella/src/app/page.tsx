'use client'

import { useEffect, useRef, useState } from 'react'
import Lottie from 'lottie-react'

// Typewriter effect with individual letter animations
function initTypewriterEffect() {
  const expiryElement = document.querySelector('.slide.active .slide-expiry') as HTMLElement;

  if (!expiryElement) return;

  const text = expiryElement.textContent || '';
  expiryElement.innerHTML = '';

  function animateTypewriter() {
    // Split text into individual letters
    const letters = text.split('').map((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter === ' ' ? '\u00A0' : letter; // Preserve spaces
      span.className = 'letter';
      return span;
    });

    letters.forEach(letter => expiryElement.appendChild(letter));

    // Start fade-in animation with staggered delays
    letters.forEach((letter, index) => {
      setTimeout(() => {
        letter.classList.add('fade-in');
      }, index * 100);
    });

    // Start fade-out animation after delay
    const totalFadeInTime = letters.length * 100 + 500; // 500ms for each letter animation
    const holdTime = 1000; // 1 second hold

    setTimeout(() => {
      letters.forEach((letter, index) => {
        setTimeout(() => {
          letter.classList.remove('fade-in');
          letter.classList.add('fade-out');
        }, index * 100);
      });

      // After fade-out completes, wait 0.5s and restart
      const totalFadeOutTime = letters.length * 100 + 500; // 500ms for each letter fade-out
      setTimeout(() => {
        // Clear all letters and restart animation
        expiryElement.innerHTML = '';
        animateTypewriter();
      }, totalFadeOutTime + 500); // 500ms delay before restarting

    }, totalFadeInTime + holdTime);
  }

  // Start the animation loop
  animateTypewriter();
}

// Re-initialize when slides change
function onSlideChange() {
  // Reset any existing animations
  document.querySelectorAll('.letter').forEach(letter => {
    letter.classList.remove('fade-in', 'fade-out');
  });
  setTimeout(initTypewriterEffect, 500); // Small delay to allow slide transition
}

class SlantedCarousel {
	constructor(container: HTMLElement) {
		this.slides = container.querySelectorAll(".slide");
		this.navDots = container.querySelectorAll(".nav-dot");
		this.prevBtn = container.querySelector(".nav-arrow.prev") as HTMLElement;
		this.nextBtn = container.querySelector(".nav-arrow.next") as HTMLElement;
		this.progressBar = container.querySelector(".progress-bar") as HTMLElement;

		this.currentSlide = 0;
		this.totalSlides = this.slides.length;
		this.isAnimating = false;
		this.autoPlayInterval = null;

		this.init();
	}

	slides: NodeListOf<Element>;
	navDots: NodeListOf<Element>;
	prevBtn: HTMLElement;
	nextBtn: HTMLElement;
	progressBar: HTMLElement;
	currentSlide: number;
	totalSlides: number;
	isAnimating: boolean;
	autoPlayInterval: number | null;

	init() {
		this.bindEvents();
		this.startAutoPlay();
		this.updateProgress();

		// Store base transforms for parallax effect
		document.querySelectorAll(".slide-background").forEach(bg => {
			const computedTransform = getComputedStyle(bg).transform;
			(bg as HTMLElement).dataset.base = computedTransform === 'none' ? '' : computedTransform;
		});
	}

	bindEvents() {
		// Navigation arrows
		this.prevBtn.addEventListener("click", () => this.prevSlide());
		this.nextBtn.addEventListener("click", () => this.nextSlide());

		// Navigation dots
		this.navDots.forEach((dot, index) => {
			dot.addEventListener("click", () => this.goToSlide(index));
		});

		// Keyboard navigation
		document.addEventListener("keydown", (e) => {
			if (e.key === "ArrowLeft") this.prevSlide();
			if (e.key === "ArrowRight") this.nextSlide();
		});

		// Mouse events for auto-play
		document.addEventListener("mouseenter", () => this.stopAutoPlay());
		document.addEventListener("mouseleave", () => this.startAutoPlay());

		// Touch support
		let startX = 0;
		document.addEventListener("touchstart", (e) => {
			startX = e.touches[0].clientX;
		});

		document.addEventListener("touchend", (e) => {
			const endX = e.changedTouches[0].clientX;
			const diff = startX - endX;

			if (Math.abs(diff) > 50) {
				if (diff > 0) {
					this.nextSlide();
				} else {
					this.prevSlide();
				}
			}
		});
	}

	goToSlide(index: number) {
		if (this.isAnimating || index === this.currentSlide) return;

		this.isAnimating = true;

		// Update slides
		this.slides.forEach((slide, i) => {
			slide.classList.remove("active", "prev", "next");

			if (i === index) {
				slide.classList.add("active");
			} else if (i < index) {
				slide.classList.add("prev");
			} else {
				slide.classList.add("next");
			}
		});

		// Update navigation dots
		this.navDots.forEach((dot, i) => {
			dot.classList.toggle("active", i === index);
		});

		this.currentSlide = index;
		this.updateProgress();

		// Trigger typewriter effect for new active slide
		setTimeout(() => {
			onSlideChange();
			this.isAnimating = false;
		}, 1500);
	}

	nextSlide() {
		const next = (this.currentSlide + 1) % this.totalSlides;
		this.goToSlide(next);
	}

	prevSlide() {
		const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
		this.goToSlide(prev);
	}

	startAutoPlay() {
		this.stopAutoPlay();
		this.autoPlayInterval = window.setInterval(() => {
			this.nextSlide();
		}, 5000);

		this.progressBar.style.transform = "scaleX(1)";
	}

	stopAutoPlay() {
		if (this.autoPlayInterval) {
			clearInterval(this.autoPlayInterval);
			this.autoPlayInterval = null;
		}
		this.progressBar.style.transform = "scaleX(0)";
	}

	updateProgress() {
		this.progressBar.style.transition = "none";
		this.progressBar.style.transform = "scaleX(0)";

		setTimeout(() => {
			this.progressBar.style.transition = "transform 5s linear";
			if (this.autoPlayInterval) {
				this.progressBar.style.transform = "scaleX(1)";
			}
		}, 50);
	}
}

export default function HomePage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const carouselRef = useRef<SlantedCarousel | null>(null);
	const [activeFilter, setActiveFilter] = useState('All Departments');
	const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
	const [deliveryAddress, setDeliveryAddress] = useState('123 Main St, Johannesburg');
	const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [arrowAnimation, setArrowAnimation] = useState<any>(null);
	const [hoveredCard, setHoveredCard] = useState<number | null>(null);
	
	// Advanced filtering states
	const [activeFilters, setActiveFilters] = useState({
		department: 'All Departments',
		priceRange: '',
		dealType: '',
		dietary: [] as string[],
		brands: [] as string[],
		timeSensitive: [] as string[],
		subCategory: ''
	});
	
	const [dropdownOpen, setDropdownOpen] = useState({
		department: false,
		price: false,
		deals: false,
		dietary: false,
		brands: false,
		time: false
	});

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

	// New smart filter dropdown states
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);

	// Delivery time state
	const [selectedDeliveryTime, setSelectedDeliveryTime] = useState<string>('');

	useEffect(() => {
		if (containerRef.current && !carouselRef.current) {
			carouselRef.current = new SlantedCarousel(containerRef.current);
		}

		// Initialize filtered products
		setFilteredProducts(products);

		// Load Lottie animation
		fetch('/animated icons/arrow.json')
			.then(response => response.json())
			.then(data => setArrowAnimation(data))
			.catch(error => console.error('Error loading animation:', error));

		// Initialize typewriter effect after carousel is ready
		setTimeout(() => {
			initTypewriterEffect();
		}, 100);

		// Add some extra visual flair
		const handleMouseMove = (e: MouseEvent) => {
			const mouseX = e.clientX / window.innerWidth;
			const mouseY = e.clientY / window.innerHeight;

			const backgrounds = containerRef.current?.querySelectorAll(".slide-background") || [];
			backgrounds.forEach((bg, i) => {
				const speed = (i + 1) * 0.5;
				const xPos = (mouseX - 0.5) * 1.5 * speed;
				const yPos = (mouseY - 0.5) * speed;

				const base = (bg as HTMLElement).dataset.base || '';
				(bg as HTMLElement).style.transform = `${base} translate(${xPos}px, ${yPos}px)`;
			});
		};

		document.addEventListener("mousemove", handleMouseMove);

		// Header scroll behavior
		const header = document.querySelector('.site-header') as HTMLElement;
		const heroSection = document.querySelector('.slideshow-container') as HTMLElement;
		
		const handleScroll = () => {
			if (!heroSection) return;
			
			const heroHeight = heroSection.offsetHeight;
			const scrollY = window.scrollY;
			
			// Show header only when scrolled past hero section
			if (scrollY > heroHeight - 100) { // Small offset for smooth transition
				header?.classList.add('visible');
			} else {
				header?.classList.remove('visible');
			}
		};

		// Initial check
		handleScroll();
		
		// Add scroll listener
		window.addEventListener('scroll', handleScroll);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener('scroll', handleScroll);
			if (carouselRef.current) {
				carouselRef.current.stopAutoPlay();
			}
		};
	}, []);

	const mockLocations = [
		// Johannesburg
		'123 Main St, Johannesburg',
		'456 Park Avenue, Sandton, Johannesburg',
		'789 Oak Street, Rosebank, Johannesburg',
		'321 Elm Road, Hyde Park, Johannesburg',
		'654 Pine Avenue, Randburg, Johannesburg',
		'987 Maple Drive, Fourways, Johannesburg',
		'147 Cedar Lane, Midrand, Johannesburg',
		'258 Birch Street, Roodepoort, Johannesburg',
		'369 Willow Way, Alberton, Johannesburg',
		'741 Poplar Road, Germiston, Johannesburg',
		'852 Oak Drive, Bedfordview, Johannesburg',
		'963 Pine Road, Edenvale, Johannesburg',
		'159 Maple Street, Kempton Park, Johannesburg',
		'357 Cedar Avenue, Benoni, Johannesburg',
		'468 Birch Lane, Boksburg, Johannesburg',
		'579 Willow Road, Springs, Johannesburg',
		'680 Poplar Avenue, Nigel, Johannesburg',
		'791 Oak Lane, Brakpan, Johannesburg',
		'802 Pine Drive, Daveyton, Johannesburg',
		'913 Maple Road, Duduza, Johannesburg',
		
		// Pretoria/Tshwane
		'123 Church Street, Pretoria',
		'456 Vermeulen Street, Brooklyn, Pretoria',
		'789 Schoeman Street, Arcadia, Pretoria',
		'321 Pretorius Street, Sunnyside, Pretoria',
		'654 Francis Baard Street, CBD, Pretoria',
		'987 Duncan Street, Hatfield, Pretoria',
		'147 Lynnwood Road, Lynnwood, Pretoria',
		'258 Atterbury Road, Menlo Park, Pretoria',
		'369 Garsfontein Road, Moreleta Park, Pretoria',
		'741 Jan Shoba Street, Soshanguve, Pretoria',
		'852 Solomon Mahlangu Drive, Mamelodi, Pretoria',
		'963 Morkels Close, Waterkloof, Pretoria',
		'159 Wierda Road, Wierda Valley, Pretoria',
		'357 Lavender Road, Centurion, Pretoria',
		'468 Hendrik Verwoerd Drive, Centurion',
		'579 John Vorster Drive, Pretoria East',
		'680 Tsamaya Road, Atteridgeville, Pretoria',
		'791 Elias Motsoaledi Street, Eersterust, Pretoria',
		'802 Seshego Street, Mabopane, Pretoria',
		'913 Kgosi Mampuru Street, Ga-Rankuwa, Pretoria',
		
		// Cape Town
		'123 Adderley Street, Cape Town CBD',
		'456 Long Street, Cape Town',
		'789 Bree Street, Cape Town',
		'321 St George\'s Mall, Cape Town',
		'654 Strand Street, Cape Town',
		'987 Waterkant Street, Green Point, Cape Town',
		'147 Camps Bay Drive, Camps Bay, Cape Town',
		'258 Main Road, Sea Point, Cape Town',
		'369 Beach Road, Mouille Point, Cape Town',
		'741 Victoria Road, Bantry Bay, Cape Town',
		'852 Main Road, Claremont, Cape Town',
		'963 Kendal Road, Kenilworth, Cape Town',
		'159 Ottery Road, Ottery, Cape Town',
		'357 Liesbeek Parkway, Rosebank, Cape Town',
		'468 Paradise Road, Bishopscourt, Cape Town',
		'579 Main Road, Rondebosch, Cape Town',
		'680 Roeland Street, Cape Town',
		'791 Voortrekker Road, Parow, Cape Town',
		'802 De Villiers Street, Stellenbosch',
		'913 Dorp Street, Stellenbosch',
		'159 Van Riebeeck Street, Paarl',
		'357 Church Street, Franschhoek',
		'468 Berg Street, Hermanus',
		'579 Victoria Street, George',
		'680 Knysna Road, Knysna',
		'791 Long Street, Mossel Bay',
		'802 Main Road, Plettenberg Bay',
		'913 Storms River Road, Tsitsikamma',
		
		// Durban
		'123 Smith Street, Durban CBD',
		'456 Florida Road, Morningside, Durban',
		'789 Umhlanga Rocks Drive, Umhlanga, Durban',
		'321 Musgrave Road, Musgrave, Durban',
		'654 West Street, Durban',
		'987 Point Road, Durban Point',
		'147 Marine Drive, Bluff, Durban',
		'258 Kingsmead Road, Kingsmead, Durban',
		'369 Old Fort Road, Fort, Durban',
		'741 Essenwood Road, Essenwood, Durban',
		'852 Stamford Hill Road, Stamford Hill, Durban',
		'963 Chelmsford Road, Chelmsford, Durban',
		'159 Windermere Road, Windermere, Durban',
		'357 Jan Smuts Highway, Durban North',
		'468 Brickhill Road, Kloof, Durban',
		'579 Gillitts Road, Gillitts, Durban',
		'680 Inanda Road, Inanda, Durban',
		'791 Phoenix Highway, Phoenix, Durban',
		'802 Main Road, Verulam',
		'913 King Shaka Avenue, La Mercy',
		
		// Port Elizabeth
		'123 Govan Mbeki Avenue, Port Elizabeth',
		'456 Strandfontein Road, Strandfontein, Port Elizabeth',
		'789 Heugh Road, Humewood, Port Elizabeth',
		'321 Cape Road, Newton Park, Port Elizabeth',
		'654 Walmer Boulevard, Walmer, Port Elizabeth',
		'987 Old Cape Road, Port Elizabeth',
		'147 Main Road, Walmer, Port Elizabeth',
		'258 6th Avenue, Summerstrand, Port Elizabeth',
		'369 Mangold Street, North End, Port Elizabeth',
		'741 Rink Street, Central, Port Elizabeth',
		'852 Prospect Hill, Port Elizabeth',
		'963 Deal Party, Deal Party, Port Elizabeth',
		
		// Bloemfontein
		'123 Nelson Mandela Drive, Bloemfontein',
		'456 Zastron Street, Bloemfontein',
		'789 Henry Street, Bloemfontein',
		'321 West Burger Street, Bloemfontein',
		'654 President Brand Street, Bloemfontein',
		'987 St Andrew Street, Bloemfontein',
		'147 Kellner Street, Bloemfontein',
		'258 East Burger Street, Bloemfontein',
		
		// East London
		'123 Oxford Street, East London',
		'456 Buffalo Street, East London',
		'789 John Bailie Road, East London',
		'321 Alexandra Road, East London',
		'654 Fleet Street, East London',
		'987 Moore Street, East London',
		
		// Pietermaritzburg
		'123 Commercial Road, Pietermaritzburg',
		'456 Church Street, Pietermaritzburg',
		'789 Victoria Road, Pietermaritzburg',
		'321 Loop Street, Pietermaritzburg',
		'654 Pine Street, Pietermaritzburg',
		'987 Chief Albert Luthuli Street, Pietermaritzburg',
		
		// Nelspruit
		'123 Paul Kruger Street, Nelspruit',
		'456 Ferreira Street, Nelspruit',
		'789 Louis Trichardt Street, Nelspruit',
		'321 Brown Street, Nelspruit',
		'654 Madiba Drive, Nelspruit',
		
		// Kimberley
		'123 Du Toitspan Road, Kimberley',
		'456 Stockdale Street, Kimberley',
		'789 Angel Street, Kimberley',
		'321 Market Square, Kimberley',
		
		// Upington
		'123 Schroder Street, Upington',
		'456 Le Roux Street, Upington',
		'789 Scott Street, Upington',
		
		// Rustenburg
		'123 Hefer Street, Rustenburg',
		'456 Brink Street, Rustenburg',
		'789 Martin Street, Rustenburg',
		
		// Polokwane
		'123 Landros Mare Street, Polokwane',
		'456 Grobler Street, Polokwane',
		'789 Bok Street, Polokwane',
		
		// Mahikeng
		'123 Market Street, Mahikeng',
		'456 Shippard Street, Mahikeng',
		
		// Mbombela (Nelspruit area)
		'123 White River Road, White River',
		'456 Sabie Road, Hazyview',
		'789 Graskop Road, Graskop',
		
		// Richards Bay
		'123 Kruger Rand Road, Richards Bay',
		'456 Bell Street, Richards Bay',
		
		// Newcastle
		'123 Harding Street, Newcastle',
		'456 Allen Street, Newcastle',
		
		// Dundee
		'123 Victoria Street, Dundee',
		'456 Albert Street, Dundee',
		
		// Ladysmith
		'123 Murchison Street, Ladysmith',
		'456 Lyell Street, Ladysmith',
		
		// Vryheid
		'123 Joubert Street, Vryheid',
		'456 Van Rooyen Street, Vryheid',
		
		// Volksrust
		'123 Joubert Street, Volksrust',
		'456 Church Street, Volksrust'
	];

	const handleAddressChange = (value: string) => {
		setDeliveryAddress(value);
		
		if (value.length > 0) {
			const searchTerm = value.toLowerCase().trim();
			
			// Common abbreviations mapping
			const abbreviations = {
				'jhb': 'johannesburg',
				'johan': 'johannesburg', 
				'joburg': 'johannesburg',
				'pta': 'pretoria',
				'pret': 'pretoria',
				'cpt': 'cape town',
				'cape': 'cape town',
				'dbn': 'durban',
				'pe': 'port elizabeth',
				'pmb': 'pietermaritzburg',
				'bloom': 'bloemfontein',
				'ct': 'cape town',
				'el': 'east london'
			};
			
			// Expand abbreviations
			const expandedTerm = (abbreviations as any)[searchTerm] || searchTerm;
			
			// Score and filter locations
			const scoredResults = mockLocations.map(location => {
				const locationLower = location.toLowerCase();
				let score = 0;
				
				// Exact match at start gets highest score
				if (locationLower.startsWith(searchTerm)) score += 100;
				if (locationLower.startsWith(expandedTerm)) score += 90;
				
				// Word boundary matches (whole words)
				const words = locationLower.split(/[,\s]+/);
				if (words.some(word => word === searchTerm)) score += 80;
				if (words.some(word => word === expandedTerm)) score += 70;
				
				// City name matches
				const cityMatch = locationLower.match(/,\s*([^,]+)$/);
				if (cityMatch) {
					const city = cityMatch[1].trim();
					if (city.includes(searchTerm) || city.includes(expandedTerm)) score += 60;
					if (city.startsWith(searchTerm) || city.startsWith(expandedTerm)) score += 50;
				}
				
				// Partial matches get lower scores
				if (locationLower.includes(searchTerm)) score += 30;
				if (locationLower.includes(expandedTerm)) score += 25;
				
				// Street name matches
				const streetMatch = locationLower.match(/^([^,]+),\s*/);
				if (streetMatch) {
					const street = streetMatch[1].trim();
					if (street.includes(searchTerm)) score += 20;
					if (street.startsWith(searchTerm)) score += 15;
				}
				
				// Penalize very long results (less relevant)
				if (location.length > 50) score -= 5;
				
				return { location, score };
			}).filter(result => result.score > 0) // Only include matches
			.sort((a, b) => b.score - a.score) // Sort by score descending
			.slice(0, 8) // Limit to top 8 results
			.map(result => result.location); // Extract just the location strings
			
			setAddressSuggestions(scoredResults);
			setShowSuggestions(scoredResults.length > 0);
		} else {
			setAddressSuggestions([]);
			setShowSuggestions(false);
		}
	};

	const selectSuggestion = (suggestion: string) => {
		setDeliveryAddress(suggestion);
		setShowSuggestions(false);
		setAddressSuggestions([]);
	};

	const handleFilterChange = (filter: string) => {
		setActiveFilter(filter);
		if (filter === 'All Departments') {
			setFilteredProducts(products);
		} else {
			const filtered = products.filter(product => product.category === filter);
			setFilteredProducts(filtered);
		}
	};

	const handleAddToCart = (productName: string) => {
		console.log(`Added ${productName} to cart`);
		// TODO: Implement cart functionality
	};

	const handleAdvancedFilter = (type: keyof typeof activeFilters, value: string | string[]) => {
		const newFilters = { ...activeFilters };
		
		if (Array.isArray(value)) {
			// Handle array values (multiple selections)
			if ((newFilters as any)[type].includes(value[0])) {
				// Remove if already selected
				(newFilters as any)[type] = (newFilters as any)[type].filter((item: string) => !value.includes(item));
			} else {
				// Add if not selected
				(newFilters as any)[type].push(...value);
			}
		} else {
			// Handle single values
			if ((newFilters as any)[type] === value) {
				// Clear if same value clicked
				(newFilters as any)[type] = type === 'department' ? 'All Departments' : type === 'subCategory' ? '' : '';
			} else {
				(newFilters as any)[type] = value;
			}
		}
		
		setActiveFilters(newFilters);
		applyFilters(newFilters);
	};

	const applyFilters = (filters: typeof activeFilters) => {
		let filtered = [...products];

		// Department filter
		if (filters.department !== 'All Departments') {
			if (filters.department === 'Special Offers') {
				filtered = filtered.filter(product => product.isNew || product.expiringSoon);
			} else {
				filtered = filtered.filter(product => product.category === filters.department);
			}
		}

		// Sub-category filter
		if (filters.subCategory) {
			filtered = filtered.filter(product => product.subCategory === filters.subCategory);
		}

		// Price range filter
		if (filters.priceRange) {
			switch (filters.priceRange) {
				case 'Under R50':
					filtered = filtered.filter(product => product.price < 50);
					break;
				case 'R50 - R200':
					filtered = filtered.filter(product => product.price >= 50 && product.price <= 200);
					break;
				case 'R200 - R500':
					filtered = filtered.filter(product => product.price >= 200 && product.price <= 500);
					break;
				case 'Over R500':
					filtered = filtered.filter(product => product.price > 500);
					break;
			}
		}

		// Deal type filter
		if (filters.dealType) {
			filtered = filtered.filter(product => product.dealType === filters.dealType);
		}

		// Dietary filters (multiple selection)
		if (filters.dietary.length > 0) {
			filtered = filtered.filter(product => 
				filters.dietary.some(diet => 
					product.dietary.includes(diet) || 
					(diet === 'Organic' && product.isOrganic) ||
					(diet === 'Vegan' && product.isVegan) ||
					(diet === 'Gluten-Free' && product.isGlutenFree) ||
					(diet === 'Halal' && product.isHalal) ||
					(diet === 'Low Carb' && product.isLowCarb)
				)
			);
		}

		// Brand filters (multiple selection)
		if (filters.brands.length > 0) {
			filtered = filtered.filter(product => filters.brands.includes(product.brand));
		}

		// Time-sensitive filters (multiple selection)
		if (filters.timeSensitive.length > 0) {
			filtered = filtered.filter(product => 
				filters.timeSensitive.some(timeFilter => 
					(timeFilter === 'Expiring Soon' && product.expiringSoon) ||
					(timeFilter === 'New This Week' && product.isNew) ||
					(timeFilter === 'Flash Sale' && product.dealType === 'Flash Sale')
				)
			);
		}

		setFilteredProducts(filtered);
	};

	const toggleDropdown = (dropdown: keyof typeof dropdownOpen) => {
		setDropdownOpen(prev => ({
			...prev,
			[dropdown]: !prev[dropdown]
		}));
	};

	// New smart filter dropdown toggle
	const toggleSmartDropdown = (dropdownId: string) => {
		setOpenDropdown(prev => prev === dropdownId ? null : dropdownId);
	};

	const scrollToNext = () => {
		const scroller = document.querySelector('.gui-carousel--scroller') as HTMLElement;
		if (scroller) {
			const containerWidth = scroller.clientWidth;
			scroller.scrollBy({ left: containerWidth, behavior: 'smooth' }); // Scroll by exactly 5 cards width
		}
	};

	const scrollToPrev = () => {
		const scroller = document.querySelector('.gui-carousel--scroller') as HTMLElement;
		if (scroller) {
			const containerWidth = scroller.clientWidth;
			scroller.scrollBy({ left: -containerWidth, behavior: 'smooth' }); // Scroll by exactly 5 cards width
		}
	};

	const getDeliveryTime = () => {
		const now = new Date();
		const hour = now.getHours();
		if (hour < 12) return '12-1pm';
		if (hour < 14) return '2-3pm';
		if (hour < 16) return '4-5pm';
		if (hour < 18) return '6-7pm';
		return 'Tomorrow';
	};

	const getCurrentDay = () => {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		return days[new Date().getDay()];
	};

	const getCurrentTimeSlot = () => {
		const now = new Date();
		const hour = now.getHours();
		if (hour >= 6 && hour < 8) return '6-8am';
		if (hour >= 8 && hour < 10) return '8-10am';
		if (hour >= 10 && hour < 12) return '10am-12pm';
		if (hour >= 12 && hour < 14) return '12-2pm';
		if (hour >= 14 && hour < 16) return '2-4pm';
		if (hour >= 16 && hour < 18) return '4-6pm';
		if (hour >= 18 && hour < 20) return '6-8pm';
		return '8-10am'; // Default for next day
	};

	const handleDeliveryTimeSelect = (timeSlot: string) => {
		setSelectedDeliveryTime(timeSlot);
		// TODO: Implement filtering logic for delivery time
		console.log(`Selected delivery time: ${timeSlot}`);
	};

	const products = [
		{
			name: 'Fresh Sourdough Loaf',
			category: 'Bakery',
			subCategory: 'Bread',
			price: 24.99,
			originalPrice: 34.99,
			brand: 'Local Bakery',
			dietary: ['Vegetarian'],
			dealType: 'Percentage Off',
			isNew: false,
			expiringSoon: true,
			isOrganic: false,
			isVegan: true,
			isGlutenFree: false,
			isHalal: true,
			isLowCarb: false,
			description: 'Artisanal sourdough bread made with\ntraditional fermentation methods'
		},
		{
			name: 'Organic Croissant Box',
			category: 'Bakery',
			subCategory: 'Pastries',
			price: 49.99,
			originalPrice: 69.99,
			brand: 'Artisan Bakes',
			dietary: ['Vegetarian'],
			dealType: 'Percentage Off',
			isNew: true,
			expiringSoon: false,
			isOrganic: true,
			isVegan: false,
			isGlutenFree: false,
			isHalal: false,
			isLowCarb: false,
			description: 'Premium buttery croissants baked fresh\ndaily with organic ingredients'
		},
		{
			name: 'Free Range Chicken',
			category: 'Meat & Poultry',
			subCategory: 'Chicken',
			price: 89.99,
			originalPrice: 119.99,
			brand: 'Farm Fresh',
			dietary: [],
			dealType: 'Percentage Off',
			isNew: false,
			expiringSoon: true,
			isOrganic: false,
			isVegan: false,
			isGlutenFree: false,
			isHalal: true,
			isLowCarb: true,
			description: 'Humanely raised free-range chicken,\nperfect for healthy home cooking'
		},
		{
			name: 'Organic Avocados 4-pack',
			category: 'Fruits & Vegetables',
			subCategory: 'Fruits',
			price: 29.99,
			originalPrice: 39.99,
			brand: 'Green Farms',
			dietary: ['Vegan', 'Gluten-Free'],
			dealType: 'Buy One Get One',
			isNew: true,
			expiringSoon: false,
			isOrganic: true,
			isVegan: true,
			isGlutenFree: true,
			isHalal: true,
			isLowCarb: true,
			description: 'Fresh organic avocados perfect for\nhealthy breakfasts and salads'
		},
		{
			name: 'Full Cream Milk',
			category: 'Dairy',
			subCategory: 'Milk',
			price: 14.99,
			originalPrice: 19.99,
			brand: 'Dairy Best',
			dietary: ['Vegetarian'],
			dealType: 'Bundle Deal',
			isNew: false,
			expiringSoon: true,
			isOrganic: false,
			isVegan: false,
			isGlutenFree: true,
			isHalal: false,
			isLowCarb: false,
			description: 'Rich and creamy full cream milk\nfrom grass-fed cows'
		},
		{
			name: 'Coca Cola 2L',
			category: 'Beverages',
			subCategory: 'Soft Drinks',
			price: 24.99,
			originalPrice: 29.99,
			brand: 'Coca Cola',
			dietary: ['Vegan', 'Vegetarian'],
			dealType: 'Percentage Off',
			isNew: false,
			expiringSoon: false,
			isOrganic: false,
			isVegan: true,
			isGlutenFree: true,
			isHalal: true,
			isLowCarb: false,
			description: 'Classic Coca Cola soft drink in a\nconvenient 2-liter bottle'
		},
		{
			name: 'Premium Coffee Beans',
			category: 'Beverages',
			subCategory: 'Coffee',
			price: 89.99,
			originalPrice: 129.99,
			brand: 'Coffee Masters',
			dietary: ['Vegan', 'Vegetarian'],
			dealType: 'Percentage Off',
			isNew: true,
			expiringSoon: false,
			isOrganic: true,
			isVegan: true,
			isGlutenFree: true,
			isHalal: true,
			isLowCarb: false,
			description: 'Single-origin Arabica coffee beans\nroasted to perfection for rich flavor'
		},
		{
			name: 'Spaghetti Pasta 500g',
			category: 'Pantry',
			subCategory: 'Pasta & Rice',
			price: 12.99,
			originalPrice: 16.99,
			brand: 'Italian Kitchen',
			dietary: ['Vegan', 'Vegetarian'],
			dealType: 'Percentage Off',
			isNew: false,
			expiringSoon: true,
			isOrganic: false,
			isVegan: true,
			isGlutenFree: false,
			isHalal: true,
			isLowCarb: false,
			description: 'Traditional Italian spaghetti pasta,\nperfect for classic dishes'
		},
		{
			name: 'Chicken Curry Ready Meal',
			category: 'Ready Meals',
			subCategory: 'Curry',
			price: 45.99,
			originalPrice: 59.99,
			brand: 'Chef\'s Kitchen',
			dietary: [],
			dealType: 'Flash Sale',
			isNew: true,
			expiringSoon: true,
			isOrganic: false,
			isVegan: false,
			isGlutenFree: false,
			isHalal: true,
			isLowCarb: false,
			description: 'Authentic chicken curry with aromatic\nspices and tender chicken pieces'
		},
		{
			name: 'Dog Food Premium 10kg',
			category: 'Petshop',
			subCategory: 'Dog Food',
			price: 299.99,
			originalPrice: 399.99,
			brand: 'Pet Paradise',
			dietary: [],
			dealType: 'Percentage Off',
			isNew: false,
			expiringSoon: false,
			isOrganic: true,
			isVegan: false,
			isGlutenFree: false,
			isHalal: false,
			isLowCarb: false,
			description: 'Premium dog food with balanced\nnutrition for healthy pets'
		}
	];

	const departments: Record<string, string[]> = {
		'Bakery': ['Bread', 'Pastries'],
		'Meat & Poultry': ['Chicken'],
		'Fruits & Vegetables': ['Fruits'],
		'Dairy': ['Milk'],
		'Beverages': ['Soft Drinks', 'Coffee'],
		'Pantry': ['Pasta & Rice'],
		'Ready Meals': ['Curry'],
		'Petshop': ['Dog Food'],
		'Special Offers': []
	};

	const categories = [
		{ name: 'Pork', image: '/category-images/pork.png' },
		{ name: 'Chicken', image: '/category-images/chicken.png' },
		{ name: 'Fish', image: '/category-images/fish.png' },
		{ name: 'Beef', image: '/category-images/beef.png' },
		{ name: 'Lamb', image: '/category-images/lamb.png' },
		{ name: 'Vegetables', image: '/category-images/vegetables.png' },
		{ name: 'Fruits', image: '/category-images/fruits.png' },
		{ name: 'Dairy', image: '/category-images/dairy.png' },
		{ name: 'Bakery', image: '/category-images/bakery.png' },
		{ name: 'Beverages', image: '/category-images/beverages.png' },
	];

	// Smart filter options
	const smartFilters = {
		departments: [
			{ label: 'Bakery', icon: '🥖' },
			{ label: 'Meat & Poultry', icon: '🥩' },
			{ label: 'Fruits & Vegetables', icon: '🥕' },
			{ label: 'Dairy', icon: '🥛' },
			{ label: 'Beverages', icon: '🥤' },
			{ label: 'Pantry & Household', icon: '🍝' },
			{ label: 'Frozen & Ready Meals', icon: '🧊' }
		],
		deals: [
			{ label: 'Top Deals 🔥', icon: '' },
			{ label: 'Flash Sales ⚡', icon: '' },
			{ label: 'Weekly Specials', icon: '📅' },
			{ label: 'Bundles & Combos', icon: '📦' }
		],
		delivery: [
			{ label: 'Deliver ASAP 🚀', icon: '' },
			{ label: 'Schedule for Later', icon: '⏰' }
		],
		lifestyle: [
			{ label: 'Organic & Fresh', icon: '🌱' },
			{ label: 'Family Packs', icon: '👨‍👩‍👧‍👦' },
			{ label: 'Vegan & Plant-Based', icon: '🌿' }
		]
	};

	return (
		<>
			{/* Header Section */}
			<header className="site-header">
				{/* Mobile Header */}
				<div className="mobile-header">
					<div className="mobile-header-top">
						{/* Left: Deliver to section */}
						<div className="mobile-deliver-to">
							<div className="deliver-to-compact">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
								<div className="deliver-to-text">
									<span className="deliver-label-mobile">Deliver to:</span>
									<div className="address-display">{deliveryAddress || 'Select address'}</div>
								</div>
							</div>
						</div>

						{/* Right: Delivery time button */}
						<div className="mobile-delivery-time">
							<button 
								className="delivery-time-button"
								onClick={() => {
									// Toggle delivery time selection
									const timeSlot = getCurrentTimeSlot();
									handleDeliveryTimeSelect(timeSlot);
								}}
							>
								<div className="day-text">{getCurrentDay()}</div>
								<div className="time-text">{selectedDeliveryTime || getCurrentTimeSlot()}</div>
							</button>
						</div>
					</div>

					{/* Search bar with voice input */}
					<div className="mobile-search-section">
						<div className="mobile-search-container">
							<input 
								type="text" 
								placeholder="Search for products and brands..." 
								className="mobile-search-input"
							/>
							<button className="voice-search-button">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M19 10v1a7 7 0 01-14 0v-1M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</button>
							<button className="mobile-search-button">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Desktop Header */}
				<div className="desktop-header">
					<div className="header-top">
						<div className="header-left">
							<img src="/website-images/logo.png" alt="Sella Logo" className="company-logo" />
						</div>
						<div className="header-center">
							<div className="search-container">
								<input 
									type="text" 
									placeholder="Search for products and brands..." 
									className="search-input"
								/>
								<button className="search-button">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</button>
							</div>
						</div>
						<div className="header-right">
							<div className="deliver-to">
								<span className="deliver-label">Deliver to:</span>
								<div className="address-input-container">
									<input
										type="text"
										value={deliveryAddress}
										onChange={(e) => handleAddressChange(e.target.value)}
										onFocus={() => deliveryAddress && setShowSuggestions(true)}
										onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
										className="address-input"
										placeholder="Enter delivery address"
									/>
									<div className="location-icon">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
									</div>
									{showSuggestions && addressSuggestions.length > 0 && (
										<div className="address-suggestions">
											{addressSuggestions.map((suggestion, index) => (
												<div
													key={index}
													className="suggestion-item"
													onClick={() => selectSuggestion(suggestion)}
												>
													{suggestion}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="user-profile">
								<div className="profile-greeting">
									<div className="profile-icon">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											<circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
									</div>
									<div className="greeting-text">
										<div className="greeting-message">Good afternoon</div>
										<div className="sign-in">Sign in / Sign up</div>
									</div>
								</div>
							</div>
							<div className="cart-section">
								<div className="cart-icon">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</div>
								<span className="cart-price">R0.00</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Departments Sidebar */}
			{sidebarOpen && (
				<>
					<div className="sidebar-overlay" onClick={() => {setSidebarOpen(false); setSelectedDepartment(null);}}></div>
					<div className="departments-sidebar">
						<div className="sidebar-header">
							<h3>{selectedDepartment ? selectedDepartment : 'Departments'}</h3>
							<button className="sidebar-close" onClick={() => {setSidebarOpen(false); setSelectedDepartment(null);}}>×</button>
						</div>
						<div className="sidebar-content">
							{selectedDepartment ? (
								<>
									{/* Sub-niches */}
									<div className="sidebar-back" onClick={() => setSelectedDepartment(null)}>← Back to Departments</div>
									{departments[selectedDepartment].map((sub: string) => (
										<div key={sub} className="sidebar-item" onClick={() => {
											handleAdvancedFilter('subCategory', sub);
											setSidebarOpen(false);
											setSelectedDepartment(null);
										}}>
											{sub}
										</div>
									))}
								</>
							) : (
								// Main departments
								Object.keys(departments).map(dept => (
									<div key={dept} className="sidebar-item" onClick={() => {
										if (departments[dept].length > 0) {
											setSelectedDepartment(dept);
										} else {
											handleAdvancedFilter('department', dept);
											setSidebarOpen(false);
										}
									}}>
										{dept} {departments[dept].length > 0 && <span className="item-arrow">→</span>}
									</div>
								))
							)}
						</div>
					</div>
				</>
			)}

			<div ref={containerRef}>
				<div className="slideshow-container">
					<div className="slide active">
						<div className="slide-background deal-bg-bakery"></div>
						<div className="slide-overlay"></div>
						<div className="slide-content">
							<div className="slide-expiry">Deal ends 12 Oct</div>
							<h2 className="slide-title">Fresh Sourdough Loaf</h2>
							<div className="deal-price-row">
								<span className="deal-price-current">R24.99</span>
								<span className="deal-price-original">R34.99</span>
								<span className="deal-save-badge">SAVE R10</span>
							</div>
							<div className="deal-meta">
								<span className="deal-meta-item">Per loaf</span>
								<span className="deal-meta-item">From Woolworths</span>
							</div>
							<div className="btn-container">
								<div className="btn-drawer transition-top">expires in...</div>
								<div className="btn-drawer transition-bottom">...8 hours</div>

								<button className="btn">
									<span className="btn-text">Get Offer</span>
								</button>

								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
							</div>
						</div>
						<div className="slide-image">
							<img src="/product images (demo)/loaf.png" alt="Fresh sourdough loaf" className="product-image-large" />
						</div>
					</div>

					<div className="slide">
						<div className="slide-background deal-bg-produce"></div>
						<div className="slide-overlay"></div>
						<div className="slide-content">
							<div className="slide-expiry">Deal ends 18 Oct</div>
							<h2 className="slide-title">Organic Avocados 4-pack</h2>
							<div className="deal-price-row">
								<span className="deal-price-current">R29.99</span>
								<span className="deal-price-original">R39.99</span>
								<span className="deal-save-badge">SAVE R10</span>
							</div>
							<div className="deal-meta">
								<span className="deal-meta-item">R7.50 each</span>
								<span className="deal-meta-item">From Pick n Pay</span>
							</div>
							<div className="btn-container">
								<div className="btn-drawer transition-top">expires in...</div>
								<div className="btn-drawer transition-bottom">...8 hours</div>

								<button className="btn">
									<span className="btn-text">Shop Deal</span>
								</button>

								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
							</div>
						</div>
						<div className="slide-image">
							<img src="/product images (demo)/loaf.png" alt="Organic avocados" className="product-image-large" />
						</div>
					</div>

					<div className="slide">
						<div className="slide-background deal-bg-meat"></div>
						<div className="slide-overlay"></div>
						<div className="slide-content">
							<div className="slide-expiry">Deal ends 20 Oct</div>
							<h2 className="slide-title">Free Range Chicken 2kg</h2>
							<div className="deal-price-row">
								<span className="deal-price-current">R89.99</span>
								<span className="deal-price-original">R119.99</span>
								<span className="deal-save-badge">SAVE R30</span>
							</div>
							<div className="deal-meta">
								<span className="deal-meta-item">R45/kg</span>
								<span className="deal-meta-item">From Checkers</span>
							</div>
							<div className="btn-container">
								<div className="btn-drawer transition-top">expires in...</div>
								<div className="btn-drawer transition-bottom">...8 hours</div>

								<button className="btn">
									<span className="btn-text">Add to Basket</span>
								</button>

								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
							</div>
						</div>
						<div className="slide-image">
							<img src="/product images (demo)/loaf.png" alt="Free range chicken" className="product-image-large" />
						</div>
					</div>

					<div className="slide">
						<div className="slide-background deal-bg-bakery"></div>
						<div className="slide-overlay"></div>
						<div className="slide-content">
							<div className="slide-expiry">Deal ends 14 Oct</div>
							<h2 className="slide-title">Croissant Box 6-pack</h2>
							<div className="deal-price-row">
								<span className="deal-price-current">R49.99</span>
								<span className="deal-price-original">R69.99</span>
								<span className="deal-save-badge">SAVE R20</span>
							</div>
							<div className="deal-meta">
								<span className="deal-meta-item">R8.33 each</span>
								<span className="deal-meta-item">From Cape Bakery</span>
							</div>
							<div className="btn-container">
								<div className="btn-drawer transition-top">expires in...</div>
								<div className="btn-drawer transition-bottom">...8 hours</div>

								<button className="btn">
									<span className="btn-text">Shop Deal</span>
								</button>

								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
								<svg
									className="btn-corner"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="-1 1 32 32"
								>
									<path
										d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
									></path>
								</svg>
							</div>
						</div>
						<div className="slide-image">
							<img src="/product images (demo)/loaf.png" alt="Croissant box" className="product-image-large" />
						</div>
					</div>
				</div>

				<div className="navigation">
					<div className="nav-dot active" data-slide="0"></div>
					<div className="nav-dot" data-slide="1"></div>
					<div className="nav-dot" data-slide="2"></div>
					<div className="nav-dot" data-slide="3"></div>
				</div>

				<div className="nav-arrow prev">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</div>
				<div className="nav-arrow next">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</div>

				<div className="progress-bar"></div>
			</div>

			{/* Search by Category Section */}
			<section className="search-by-category">
				<div className="section-divider">
					<h2>Search by Category</h2>
					<div className="section-divider-line">
						<img src="/homepage-section images/search-by-category.png" alt="Search by Category Icon" className="section-divider-icon" />
					</div>
					<button className="view-all-btn">
						View All
						<div className="icon">
							{arrowAnimation && (
								<Lottie 
									animationData={arrowAnimation} 
									loop={true} 
									autoplay={true}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							)}
						</div>
					</button>
				</div>
				<div className="gui-carousel" carousel-pagination="none" carousel-controls="auto" carousel-scrollbar="auto" carousel-snapstop="auto" aria-label="Search by Category Carousel">
					<div className="gui-carousel--scroller">
						{categories.map((category, index) => (
							<div key={index} className="gui-carousel--snap">
								<div className="category-card">
									<div className="category-card-image">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 200 150"
											width="200"
											height="150"
										>
											<rect width="200" height="150" fill="#f3f4f6" rx="8"/>
											<text
												x="100"
												y="85"
												textAnchor="middle"
												fontSize="32"
												fontWeight="bold"
												fill="#495c48"
												fontFamily="Arial, sans-serif"
											>
												IMAGE
											</text>
										</svg>
									</div>
									<div className="category-card-content">
										<h3 className="category-card-title">category</h3>
										<p className="category-card-description">category description</p>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="gui-carousel--controls">
						<button className="gui-carousel--control --previous" onClick={scrollToPrev} aria-label="Previous Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<button className="gui-carousel--control --next" onClick={scrollToNext} aria-label="Next Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
					</div>
				</div>
			</section>
			{/* Our Branded Products Section */}
			<section className="our-branded-products">
				<div className="section-divider">
					<h2>Our Branded Products</h2>
					<div className="section-divider-line">
						<img src="/homepage-section images/our-branded-products.png" alt="Our Branded Products Icon" className="section-divider-icon" />
					</div>
					<button className="view-all-btn">
						View All
						<div className="icon">
							{arrowAnimation && (
								<Lottie 
									animationData={arrowAnimation} 
									loop={true} 
									autoplay={true}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							)}
						</div>
					</button>
				</div>
				<div className="gui-carousel branded-products-carousel" carousel-pagination="none" carousel-controls="auto" carousel-scrollbar="auto" carousel-snapstop="auto" aria-label="Our Branded Products Carousel">
					<div className="gui-carousel--scroller">
						{filteredProducts.map((product, index) => (
							<div key={index} className="gui-carousel--snap">
								<div className="branded-product-card w-[250px] rounded-md shadow-xl overflow-hidden z-[100] relative cursor-pointer snap-start shrink-0 py-8 px-6 bg-white flex flex-col items-center justify-center gap-3 transition-all duration-300 group">
									<div className="foodCard">
										<button className="Like">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="rgb(190,190,190)"
												width="25"
												height="25"
											>
												<path
													d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
												></path>
											</svg>
										</button>

										<div className="Discount">10% OFF</div>

										<picture className="imageContainer">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 200 150"
												width="200"
												height="150"
											>
												<rect width="200" height="150" fill="#f3f4f6" rx="8"/>
												<text
													x="100"
													y="85"
													textAnchor="middle"
													fontSize="32"
													fontWeight="bold"
													fill="#495c48"
													fontFamily="Arial, sans-serif"
												>
													IMAGE
												</text>
											</svg>
										</picture>
										<p className="foodTitle">Brand product</p>
										<footer className="priceAndButton">
											<p className="Price">R9.99</p>
											<button className="button" onClick={() => handleAddToCart(product.name)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg></button>
										</footer>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="gui-carousel--controls">
						<button className="gui-carousel--control --previous" onClick={scrollToPrev} aria-label="Previous Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<button className="gui-carousel--control --next" onClick={scrollToNext} aria-label="Next Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
					</div>
				</div>
			</section>

			{/* Top Deals Section */}
			<section className="day-pay-deals">
				<div className="section-divider">
					<h2>Top Deals</h2>
					<div className="section-divider-line">
						<img src="/homepage-section images/top-deals.png" alt="Top Deals Icon" className="section-divider-icon" />
					</div>
					<button className="view-all-btn">
						View All
						<div className="icon">
							{arrowAnimation && (
								<Lottie 
									animationData={arrowAnimation} 
									loop={true} 
									autoplay={true}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							)}
						</div>
					</button>
				</div>

				<div className="gui-carousel" carousel-pagination="none" carousel-controls="auto" carousel-scrollbar="auto" carousel-snapstop="auto" aria-label="Featured Items Carousel">
					<div className="gui-carousel--scroller">
						{filteredProducts.map((product, index) => (
							<div key={index} className="gui-carousel--snap">
								<div className="card">
									<div className="card__shine"></div>
									<div className="card__glow"></div>
									<div className="card__content">
										<div className="card__image">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 200 150"
												width="200"
												height="150"
												className="card-product-image"
											>
												<rect width="200" height="150" fill="#f3f4f6" rx="8"/>
												<text
													x="100"
													y="85"
													textAnchor="middle"
													fontSize="32"
													fontWeight="bold"
													fill="#495c48"
													fontFamily="Arial, sans-serif"
												>
													IMAGE
												</text>
											</svg>
										</div>
										<div className="card__info">
											<h3 className="card__title">{product.name}</h3>
											<p className="card__price">{product.price}</p>
											<p className="card__description">{product.description}</p>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
					<div className="gui-carousel--controls">
						<button className="gui-carousel--control --prev" onClick={scrollToPrev} aria-label="Previous Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<button className="gui-carousel--control --next" onClick={scrollToNext} aria-label="Next Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
					</div>
				</div>

				{/* Ad Banners Section */}
				<div className="ad-banners-container">
					<div className="ad-banner drinks-banner">
						<div className="banner-content">
							<h3>DRINKS</h3>
							<p>TROLLEY</p>
						</div>
						<div className="banner-image">
							<img src="https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Drinks" />
						</div>
					</div>
					<div className="ad-banner braai-banner">
						<div className="banner-content">
							<h3>BRAAI</h3>
							<p>TIME</p>
						</div>
						<div className="banner-image">
							<img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Braai" />
						</div>
					</div>
					<div className="ad-banner burger-banner">
						<div className="banner-content">
							<h3>BURGER</h3>
							<p>YOUR WAY</p>
						</div>
						<div className="banner-image">
							<img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2099&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Burger" />
						</div>
					</div>
					<div className="ad-banner pizza-banner">
						<div className="banner-content">
							<h3>PIZZA</h3>
							<p>NIGHT</p>
						</div>
						<div className="banner-image">
							<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIibPbOeDQQscm9g-fDNdCvROokQJukg8nYQ&s" alt="Pizza" />
						</div>
					</div>
				</div>
			</section>

			{/* Top-Rated Products Section */}
			<section className="top-rated-products">
				<div className="section-divider">
					<h2>Top-Rated Products</h2>
					<div className="section-divider-line">
						<img src="/homepage-section images/top-rated-products.png" alt="Top-Rated Products Icon" className="section-divider-icon" />
					</div>
					<button className="view-all-btn">
						View All
						<div className="icon">
							{arrowAnimation && (
								<Lottie 
									animationData={arrowAnimation} 
									loop={true} 
									autoplay={true}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							)}
						</div>
					</button>
				</div>
				<div className="gui-carousel" carousel-pagination="none" carousel-controls="auto" carousel-scrollbar="auto" carousel-snapstop="auto" aria-label="Top-Rated Products Carousel">
					<div className="gui-carousel--scroller">
						{filteredProducts.map((product, index) => (
							<div key={index} className="gui-carousel--snap">
								<div className="card">
									<div className="card__shine"></div>
									<div className="card__glow"></div>
									<div className="card__content">
										<div className="card__image">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 200 150"
												width="200"
												height="150"
												className="card-product-image"
											>
												<rect width="200" height="150" fill="#f3f4f6" rx="8"/>
												<text
													x="100"
													y="85"
													textAnchor="middle"
													fontSize="32"
													fontWeight="bold"
													fill="#495c48"
													fontFamily="Arial, sans-serif"
												>
													IMAGE
												</text>
											</svg>
											<div className="delivery-pill">{getDeliveryTime()}</div>
											<div className="savings-pill">Saved R{Math.round((product.originalPrice || product.price) - product.price)}</div>
										</div>
											<div className="card__text">
												<div className="card__title">product name</div>
												<div className="card__description">product description</div>
											</div>
											<div className="card__footer">
												<div className="card__price">
													<span className="card__price-new">R9.99</span>
													{product.originalPrice && (
														<span className="card__price-old">R{product.originalPrice.toFixed(2)}</span>
													)}
												</div>
												<button 
													className="card__button"
													onClick={() => handleAddToCart(product.name)}
													onMouseEnter={() => setHoveredCard(index)}
													onMouseLeave={() => setHoveredCard(null)}
												>
													{hoveredCard === index ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
													</svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
													</svg>}
												</button>
											</div>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="gui-carousel--controls">
						<button className="gui-carousel--control --previous" onClick={scrollToPrev} aria-label="Previous Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<button className="gui-carousel--control --next" onClick={scrollToNext} aria-label="Next Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
					</div>
				</div>
			</section>

			{/* Shop by Lifestyle Section */}
			<section className="shop-by-lifestyle">
				<div className="section-divider">
					<h2>Shop by Lifestyle</h2>
					<div className="section-divider-line">
						<img src="/homepage-section images/shop-by-lifestyle.png" alt="Shop by Lifestyle Icon" className="section-divider-icon" />
					</div>
					<button className="view-all-btn">
						View All
						<div className="icon">
							{arrowAnimation && (
								<Lottie 
									animationData={arrowAnimation} 
									loop={true} 
									autoplay={true}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							)}
						</div>
					</button>
				</div>
				<div className="gui-carousel" carousel-pagination="none" carousel-controls="auto" carousel-scrollbar="auto" carousel-snapstop="auto" aria-label="Shop by Lifestyle Carousel">
					<div className="gui-carousel--scroller">
						{filteredProducts.map((product, index) => (
							<div key={index} className="gui-carousel--snap">
								<div className="card">
									<div className="card__shine"></div>
									<div className="card__glow"></div>
									<div className="card__content">
										<div className="card__image">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 200 150"
												width="200"
												height="150"
												className="card-product-image"
											>
												<rect width="200" height="150" fill="#f3f4f6" rx="8"/>
												<text
													x="100"
													y="85"
													textAnchor="middle"
													fontSize="32"
													fontWeight="bold"
													fill="#495c48"
													fontFamily="Arial, sans-serif"
												>
													IMAGE
												</text>
											</svg>
											<div className="delivery-pill">{getDeliveryTime()}</div>
											<div className="savings-pill">Saved R{Math.round((product.originalPrice || product.price) - product.price)}</div>
										</div>
											<div className="card__text">
												<div className="card__title">product name</div>
												<div className="card__description">product description</div>
											</div>
											<div className="card__footer">
												<div className="card__price">
													<span className="card__price-new">R9.99</span>
													{product.originalPrice && (
														<span className="card__price-old">R{product.originalPrice.toFixed(2)}</span>
													)}
												</div>
												<button 
													className="card__button"
													onClick={() => handleAddToCart(product.name)}
													onMouseEnter={() => setHoveredCard(index)}
													onMouseLeave={() => setHoveredCard(null)}
												>
													{hoveredCard === index ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
													</svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
													</svg>}
												</button>
											</div>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="gui-carousel--controls">
						<button className="gui-carousel--control --previous" onClick={scrollToPrev} aria-label="Previous Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<button className="gui-carousel--control --next" onClick={scrollToNext} aria-label="Next Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
					</div>
				</div>

				{/* Lifestyle Banners Section */}
				<div className="lifestyle-banners-container">
					<div className="lifestyle-banners-grid">
						<div className="lifestyle-banner fitness-banner">
							<div className="banner-content">
								<h3>FITNESS</h3>
								<p>FUEL</p>
							</div>
							<div className="banner-image">
								<img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Fitness" />
							</div>
						</div>
						<div className="lifestyle-banner healthy-banner">
							<div className="banner-content">
								<h3>HEALTHY</h3>
								<p>CHOICES</p>
							</div>
							<div className="banner-image">
								<img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Healthy Food" />
							</div>
						</div>
						<div className="lifestyle-banner vegan-banner">
							<div className="banner-content">
								<h3>VEGAN</h3>
								<p>VIBES</p>
							</div>
							<div className="banner-image">
								<img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=2084&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Vegan Food" />
							</div>
						</div>
						<div className="lifestyle-banner comfort-banner">
							<div className="banner-content">
								<h3>COMFORT</h3>
								<p>FOOD</p>
							</div>
							<div className="banner-image">
								<img src="https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=2087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Comfort Food" />
							</div>
						</div>
					</div>
					<div className="lifestyle-wide-banner gourmet-banner">
						<div className="banner-content">
							<h2>GOURMET EXPERIENCE</h2>
							<p>Discover premium ingredients and artisanal products for the ultimate culinary journey</p>
							<button className="banner-cta">Explore Collection</button>
						</div>
						<div className="banner-image">
							<img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Gourmet Food" />
						</div>
					</div>
				</div>
			</section>

			{/* Local Gems Section */}
			<section className="local-gems">
				<div className="section-divider">
					<h2>Local Gems</h2>
					<div className="section-divider-line">
						<img src="/homepage-section images/local-gems.png" alt="Local Gems Icon" className="section-divider-icon" />
					</div>
					<button className="view-all-btn">
						View All
						<div className="icon">
							{arrowAnimation && (
								<Lottie 
									animationData={arrowAnimation} 
									loop={true} 
									autoplay={true}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							)}
						</div>
					</button>
				</div>
				<div className="gui-carousel" carousel-pagination="none" carousel-controls="auto" carousel-scrollbar="auto" carousel-snapstop="auto" aria-label="Local Gems Carousel">
					<div className="gui-carousel--scroller">
						{filteredProducts.map((product, index) => (
							<div key={index} className="gui-carousel--snap">
								<div className="card">
									<div className="card__shine"></div>
									<div className="card__glow"></div>
									<div className="card__content">
										<div className="card__image">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 200 150"
												width="200"
												height="150"
												className="card-product-image"
											>
												<rect width="200" height="150" fill="#f3f4f6" rx="8"/>
												<text
													x="100"
													y="85"
													textAnchor="middle"
													fontSize="32"
													fontWeight="bold"
													fill="#495c48"
													fontFamily="Arial, sans-serif"
												>
													IMAGE
												</text>
											</svg>
											<div className="delivery-pill">{getDeliveryTime()}</div>
											<div className="savings-pill">Saved R{Math.round((product.originalPrice || product.price) - product.price)}</div>
										</div>
											<div className="card__text">
												<div className="card__title">product name</div>
												<div className="card__description">product description</div>
											</div>
											<div className="card__footer">
												<div className="card__price">
													<span className="card__price-new">R9.99</span>
													{product.originalPrice && (
														<span className="card__price-old">R{product.originalPrice.toFixed(2)}</span>
													)}
												</div>
												<button 
													className="card__button"
													onClick={() => handleAddToCart(product.name)}
													onMouseEnter={() => setHoveredCard(index)}
													onMouseLeave={() => setHoveredCard(null)}
												>
													{hoveredCard === index ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
													</svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
													</svg>}
												</button>
											</div>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="gui-carousel--controls">
						<button className="gui-carousel--control --previous" onClick={scrollToPrev} aria-label="Previous Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<button className="gui-carousel--control --next" onClick={scrollToNext} aria-label="Next Item">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
					</div>
				</div></section>

		</>
	)
}

