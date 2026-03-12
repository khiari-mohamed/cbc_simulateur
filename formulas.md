he res hte excel old formuals and the new oen how did we trnasforme htem to not need a devlopper anymore 

								
Formules Valables pour toute les compagnies								
								
Tableau RC								
								
CLASSE	TAUX DE PRIME 	Classe	3 A 4CV	5 A 6CV	7 A 10CV 	11 A 14 CV 	>=15 CV	
01	70%	01	77,000  	98,000  	119,000  	154,000  	184,800  	
02	80%	02	88,000  	112,000  	136,000  	176,000  	211,200  	
03	90%	03	99,000  	126,000  	153,000  	198,000  	237,600  	
04	100%	04	110,000  	140,000  	170,000  	220,000  	264,000  	
05	120%	05	132,000  	168,000  	204,000  	264,000  	316,800  	
06	140%	06	154,000  	196,000  	238,000  	308,000  	369,600  	
07	160%	07	176,000  	224,000  	272,000  	352,000  	422,400  	
08	200%	08	220,000  	280,000  	340,000  	440,000  	528,000  	
								
VOL	=(((valeur vénale*2,36)/1000)+30)*taux de réduction							
Incendie	=(((valeur vénale*2,75)/1000)+30)*taux de réduction							
								
								
								
Tous risques								
Franchise	taux	fixe						
0%	0,032	22,000						
1%	0,0265	21,750						
2%	0,021	19,000						
4%	0,017	15,000						
								
								


*********************
									
Formule suite séance du 16/02/2026									
				Valables pour toute les compagnies					
Tableau RC		Rien à changer 							
									
										
VOL	=((valeur vénale*taux de prime Vol )+Prime Fixe Vol)*taux de réduction								
Incendie	=((valeur vénale*taux de prime Incendie)+Prime Fixe Incendie)*taux de réduction								
									
									
									
Tous risques 0%									
=((valeur à neuf*taux de prime tous riques 0% )+Prime Fixe Tous risques 0%)*taux de réduction									
Tous risques 2%									
=((valeur à neuf*taux de prime tous riques 2% )+Prime Fixe Tous risques 2%)*taux de réduction									
Tous risques 4%									
=((valeur à neuf*taux de prime tous riques 4% )+Prime Fixe Tous risques 4%)*taux de réduction									
Tous risques 1%									
=((valeur à neuf*taux de prime tous riques 1% )+Prime Fixe Tous risques 1%)*taux de réduction									


*****************************************
Formules Valables par compagnies								
								
								
	LLOYD	AMANA						
Assistance	115,000	90,000						
								
	LLOYD	AMANA						
CAS	45,000	20,000						
								
								
								
	LLOYD		AMANA					
PTA	Capital 	Prime	Capital 	Prime				
	5 000	21,000	4 000	32,000				
	10 000	42,000	8 000	64,000				
								
	LLOYD	AMANA						
BG	6,5	7%	=(capital * TAux)					
								
	LLOYD	AMANA						
Frais du contrat	30,000	20,000						
								
								
								
			LLOYD					
Dommages suite émeutes et CAT NAT			30,000					
								
			AMANA					
Dommages suite émeutes 			30,000					
Dommages suite CAT NAT			40,000					
								
								
	LLOYD	AMANA						
Incendie Suite Emeutes	15,000	NC						
								


*********************************
Formules Valables par compagnies										
										
										
										
		LLOYD	AMANA		Pirme fixe à saisir par l'administrateur					
	Assistance	115,000	90,000		Pirme fixe à saisir par l'administrateur					
										
		LLOYD	AMANA							
	CAS	45,000	20,000		Pirme fixe à saisir par l'administrateur					
										
										
										
		LLOYD		AMANA						
	PTA	Capital 	Prime	Capital 	Prime		Capital et Pirme  à saisir par l'administrateur			
		5 000	21,000	4 000	32,000					
		10 000	42,000	8 000	64,000					
										
										
										
		LLOYD	AMANA							
	BG	6,5	7%	=(capital BG * Taux BG)* taux de réduction						
										
										
										
				LLOYD						
	Dommages suite émeutes et CAT NAT			30,000		Pirme fixe à saisir par l'administrateur				
										
				AMANA						
	Dommages suite émeutes 			30,000		Pirme fixe à saisir par l'administrateur				
	Dommages suite CAT NAT			40,000		Pirme fixe à saisir par l'administrateur				
										
										
										
		LLOYD	AMANA		Pirme fixe à saisir par l'administrateur					
	Incendie Suite Emeutes	15,000	NC							



**************************
and her ies the docuemtn word he sned me in the prvious time for domage collution 
OBJECTIF
Intégrer dans l’application une méthode de calcul paramétrable pour la garantie Dommages Collision :
Usage : Promenade et Affaire
L’application doit permettre à l’administrateur de modifier sans développement :
•	✅ Les taux par tranche (%)
•	✅ La prime fixe (prime de base)
•	✅ Les paliers de capital
•	✅ Le plafond du capital (ex : 50% de VV)
•	✅ Le plafond absolu (ex : 100 000 DT)
•	✅ Le taux de réduction 

2️⃣ RÈGLES MÉTIER À INTÉGRER
🔹 2.1 Paramètres généraux
Paramètre	Valeur actuelle	Doit être modifiable ?
Franchise	0%	Oui
Capital minimum	1 000 DT	Oui
Capital maximum	50% de VV	Oui
Plafond absolu	100 000 DT	Oui
Prime fixe	10 DT	Oui
Taux réduction	Variable	Oui






2.2 Règles de sélection du capital
Règle 1 : Limite du capital
Capital ≥ Capital_min
Capital ≤ min( 50% × Valeur Vénale , Plafond_absolu )
Règle 2 : Paliers de capital (paramétrables)
Fourchette	Pas autorisé
1 000 → 10 000	incrément 1 000
10 000 → 20 000	incrément 5 000
20 000 → 50 000	incrément 10 000
50 000 → 100 000	incrément 25 000

TABLE PALIERS_CAPITAUX
- borne_min
- borne_max
- pas
3️⃣ LOGIQUE DE CALCUL DE PRIME
Etape 1 : Calcul du pourcentage du capital par rapport à la VV
ratio = capital / valeur_venale
Étape 2 : Cas simple (ratio ≤ 10%)
Si :
ratio ≤ 10%
Alors :
prime_variable = capital × taux_tranche_1
Paramètre actuel :
•	taux_tranche_1 = 6.7%
•	(doit rester paramétrable en base)
👉 Dans ce cas, aucun calcul progressif n’est appliqué.
Étape 3 : Cas 2 Si Ratio > 10% (calcul progressif dégressif)
Paramètres nécessaires (paramétrables en base)
TABLE TAUX_TRANCHES
•	tranche_numero
•	taux
Exemple actuel :
Tranche	Taux
1	6.7%
2	6.3%
3	5.8%
4	5.5%
5	5.0%
Logique de calcul : 
capital_restant = capital
prime_variable = 0
valeur_tranche = 10% × valeur_venale
numero_tranche = 1
Boucle :
Tant que capital_restant > 0 :
montant_tranche = min(capital_restant, valeur_tranche)
prime_tranche = montant_tranche × taux_tranche(numero_tranche)
prime_variable += prime_tranche
capital_restant -= montant_tranche
numero_tranche += 1
⚠️ IMPORTANT :
•	Chaque tranche correspond à 10% de la valeur vénale.
•	La dernière tranche = le reste du capital, même si inférieur à 10%.

3.3 Ajout de la prime fixe
prime_nette = prime_variable + prime_fixe
(Prime fixe paramétrable)
Application d’un taux de réduction (si applicable)
prime_totale = prime_nette × (1 - taux_reduction)
(taux_reduction paramétrable)


EXIGENCES TECHNIQUES IMPORTANTES
🔹 1 Aucun taux codé en dur
Tous les éléments doivent être :
•	configurables en base de données
•	modifiables via interface admin
________________________________________
🔹 2 Paramétrage requis dans l'application
Interface admin doit permettre :
•	Modifier taux tranche 1 à 5
•	Ajouter/supprimer tranche
•	Modifier prime fixe
•	Modifier plafond %
•	Modifier plafond absolu
•	Modifier paliers capital
•	Modifier le taux réduction





SCÉNARIO 2 – TARIFICATION PAR MATRICE PARAMÉTRABLE
🎯 Objectif
Mettre en place une tarification basée sur une table de correspondance :
Prime = valeur stockée dans une matrice
(selon tranche VV + capital assuré)

Paramétrage Méthode 2
•	Création / modification des paliers VV
•	Création / modification des colonnes de capital
•	Modification des primes par cellule
•	Prime fixe
•	Taux de réduction
•	Architecture Technique Demandée
•	🔹 Table 1 : Tranches VV
•	TABLE TRANCHE_VV
•	- id
•	- borne_min
•	- borne_max
•	________________________________________
•	🔹 Table 2 : Capitaux autorisés
•	TABLE CAPITAUX
•	- id
•	- montant
•	- ordre_affichage
•	________________________________________
•	🔹 Table 3 : Matrice tarifaire
•	TABLE MATRICE_TARIF
•	- id
•	- tranche_vv_id
•	- capital_id
•	- prime_nette

