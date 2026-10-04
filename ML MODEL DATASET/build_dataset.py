import random, json, csv, hashlib
random.seed(42)
PER_LABEL = 1250

capitals = {"France":"Paris","Germany":"Berlin","Italy":"Rome","Spain":"Madrid","Portugal":"Lisbon","the Netherlands":"Amsterdam","Belgium":"Brussels","Switzerland":"Bern","Austria":"Vienna","Poland":"Warsaw","the Czech Republic":"Prague","Hungary":"Budapest","Greece":"Athens","Sweden":"Stockholm","Norway":"Oslo","Denmark":"Copenhagen","Finland":"Helsinki","Ireland":"Dublin","the United Kingdom":"London","Russia":"Moscow","Ukraine":"Kyiv","Turkey":"Ankara","Egypt":"Cairo","Kenya":"Nairobi","Nigeria":"Abuja","Ghana":"Accra","Ethiopia":"Addis Ababa","Morocco":"Rabat","Algeria":"Algiers","Japan":"Tokyo","China":"Beijing","India":"New Delhi","Pakistan":"Islamabad","Bangladesh":"Dhaka","Nepal":"Kathmandu","Thailand":"Bangkok","Vietnam":"Hanoi","the Philippines":"Manila","South Korea":"Seoul","Canada":"Ottawa","Australia":"Canberra","New Zealand":"Wellington","Brazil":"Brasilia","Argentina":"Buenos Aires","Chile":"Santiago","Peru":"Lima","Colombia":"Bogota","Mexico":"Mexico City","Cuba":"Havana","Saudi Arabia":"Riyadh","Iran":"Tehran","Iraq":"Baghdad","Jordan":"Amman","Lebanon":"Beirut","Afghanistan":"Kabul","Mongolia":"Ulaanbaatar","Kazakhstan":"Astana","Uzbekistan":"Tashkent","Iceland":"Reykjavik","Romania":"Bucharest","Bulgaria":"Sofia","Croatia":"Zagreb","Serbia":"Belgrade","Slovakia":"Bratislava","Slovenia":"Ljubljana","Lithuania":"Vilnius","Latvia":"Riga","Estonia":"Tallinn","Venezuela":"Caracas","Ecuador":"Quito","Uruguay":"Montevideo","Zimbabwe":"Harare","Zambia":"Lusaka","Uganda":"Kampala","Senegal":"Dakar","Angola":"Luanda","Tunisia":"Tunis","Libya":"Tripoli","Malaysia":"Kuala Lumpur"}
elements = {"Hydrogen":("H",1),"Helium":("He",2),"Lithium":("Li",3),"Beryllium":("Be",4),"Boron":("B",5),"Carbon":("C",6),"Nitrogen":("N",7),"Oxygen":("O",8),"Fluorine":("F",9),"Neon":("Ne",10),"Sodium":("Na",11),"Magnesium":("Mg",12),"Aluminium":("Al",13),"Silicon":("Si",14),"Phosphorus":("P",15),"Sulfur":("S",16),"Chlorine":("Cl",17),"Argon":("Ar",18),"Potassium":("K",19),"Calcium":("Ca",20),"Titanium":("Ti",22),"Chromium":("Cr",24),"Manganese":("Mn",25),"Iron":("Fe",26),"Cobalt":("Co",27),"Nickel":("Ni",28),"Copper":("Cu",29),"Zinc":("Zn",30),"Silver":("Ag",47),"Tin":("Sn",50),"Iodine":("I",53),"Tungsten":("W",74),"Platinum":("Pt",78),"Gold":("Au",79),"Mercury":("Hg",80),"Lead":("Pb",82),"Uranium":("U",92)}
events = [("Apollo 11 landed the first humans on the Moon",1969),("the Berlin Wall fell",1989),("the French Revolution began",1789),("the United States Declaration of Independence was adopted",1776),("World War I began",1914),("World War II ended",1945),("the Titanic sank",1912),("the Chernobyl nuclear disaster occurred",1986),("King John sealed the Magna Carta",1215),("Christopher Columbus made his first voyage across the Atlantic",1492),("the October Revolution took place in Russia",1917),("the American Civil War began",1861),("the Battle of Hastings was fought",1066),("the Wright brothers made their first powered flight",1903),("the first iPhone was released",2007),("Sputnik 1 was launched",1957),("the Berlin Wall was built",1961),("the Soviet Union was dissolved",1991),("euro banknotes and coins entered circulation",2002),("the Great Fire of London broke out",1666),("the Treaty of Versailles was signed",1919),("India gained independence from British rule",1947),("the Apollo 13 mission suffered an oxygen tank explosion",1970),("Alexander Fleming discovered penicillin",1928),("Watson and Crick published the double helix structure of DNA",1953),("Edmund Hillary and Tenzing Norgay first reached the summit of Mount Everest",1953),("the Eiffel Tower was completed",1889),("the Statue of Liberty was dedicated",1886),("the Panama Canal opened",1914),("the Suez Canal opened",1869),("the first modern Olympic Games were held in Athens",1896),("the Hubble Space Telescope was launched",1990),("the Curiosity rover landed on Mars",2012),("Nelson Mandela was released from prison",1990),("the United Kingdom held its Brexit referendum",2016),("the atomic bomb was dropped on Hiroshima",1945),("the Space Shuttle Columbia first flew",1981),("the Space Shuttle Challenger disaster occurred",1986),("the Cuban Missile Crisis took place",1962),("the Wall Street Crash began",1929)]
books = {"1984":"George Orwell","Animal Farm":"George Orwell","Pride and Prejudice":"Jane Austen","Hamlet":"William Shakespeare","War and Peace":"Leo Tolstoy","Moby-Dick":"Herman Melville","The Great Gatsby":"F. Scott Fitzgerald","Don Quixote":"Miguel de Cervantes","The Odyssey":"Homer","Frankenstein":"Mary Shelley","Crime and Punishment":"Fyodor Dostoevsky","One Hundred Years of Solitude":"Gabriel Garcia Marquez","The Hobbit":"J. R. R. Tolkien","Brave New World":"Aldous Huxley","The Catcher in the Rye":"J. D. Salinger","Jane Eyre":"Charlotte Bronte","Wuthering Heights":"Emily Bronte","Les Miserables":"Victor Hugo","The Divine Comedy":"Dante Alighieri","Ulysses":"James Joyce","To Kill a Mockingbird":"Harper Lee","Dracula":"Bram Stoker","On the Origin of Species":"Charles Darwin","A Brief History of Time":"Stephen Hawking","The Wealth of Nations":"Adam Smith","Leviathan":"Thomas Hobbes","The Republic":"Plato","Madame Bovary":"Gustave Flaubert","The Trial":"Franz Kafka","Things Fall Apart":"Chinua Achebe","Beloved":"Toni Morrison"}
planets = ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"]
ords = ["first","second","third","fourth","fifth","sixth","seventh","eighth"]
continents = {"Brazil":"South America","Japan":"Asia","Australia":"Oceania","Canada":"North America","Germany":"Europe","Kenya":"Africa","India":"Asia","Peru":"South America","Norway":"Europe","Nigeria":"Africa","Thailand":"Asia","Mexico":"North America","Chile":"South America","New Zealand":"Oceania","Poland":"Europe","Vietnam":"Asia","Morocco":"Africa","Argentina":"South America","Cuba":"North America","Ghana":"Africa","Sweden":"Europe","Indonesia":"Asia","Colombia":"South America","Ethiopia":"Africa","Spain":"Europe","South Korea":"Asia","Ecuador":"South America","Tanzania":"Africa","Finland":"Europe","Fiji":"Oceania","Pakistan":"Asia","Uruguay":"South America","Italy":"Europe","Senegal":"Africa","Jamaica":"North America"}
formulas = {"water":"H2O","table salt":"NaCl","carbon dioxide":"CO2","methane":"CH4","ammonia":"NH3","glucose":"C6H12O6","hydrogen peroxide":"H2O2","sulfuric acid":"H2SO4","ozone":"O3","baking soda":"NaHCO3","limestone":"CaCO3","carbon monoxide":"CO","nitric acid":"HNO3","hydrochloric acid":"HCl","ethanol":"C2H5OH","sulfur dioxide":"SO2"}
science = [
("Water boils at {v} at standard sea-level pressure.","At standard atmospheric pressure at sea level, water boils at {v}.","100 degrees Celsius",["90 degrees Celsius","110 degrees Celsius","212 degrees Celsius","80 degrees Celsius"]),
("Light travels through a vacuum at about {v}.","In a vacuum, light travels at roughly {v}.","299,792 kilometres per second",["150,000 kilometres per second","3,000 kilometres per second","1,000,000 kilometres per second"]),
("An adult human skeleton has {v}.","The adult human skeleton is made up of {v}.","206 bones",["300 bones","180 bones","256 bones"]),
("Humans typically have {v}.","A typical human cell contains {v}.","23 pairs of chromosomes",["20 pairs of chromosomes","32 pairs of chromosomes","46 pairs of chromosomes"]),
("Earth takes about {v} to orbit the Sun.","One orbit of Earth around the Sun takes about {v}.","365 days",["300 days","400 days","180 days","500 days"]),
("Sound travels through air at 20 degrees Celsius at about {v}.","At 20 degrees Celsius, the speed of sound in air is about {v}.","343 metres per second",["150 metres per second","1,000 metres per second","3,430 metres per second"]),
("The Moon takes about {v} to orbit the Earth.","The Moon completes one orbit of Earth in about {v}.","27 days",["7 days","14 days","60 days"]),
("Pi is approximately {v}.","The mathematical constant pi is approximately {v}.","3.14159",["3.41","2.718","3.0"]),
("Mount Everest rises about {v} above sea level.","The official height of Mount Everest is about {v} above sea level.","8,849 metres",["7,200 metres","9,500 metres","6,900 metres"]),
("The largest ocean on Earth is the {v}.","By area, the {v} is the largest ocean on Earth.","Pacific Ocean",["Atlantic Ocean","Indian Ocean","Arctic Ocean"]),
("The largest planet in the Solar System is {v}.","{v} is the largest planet in the Solar System.","Jupiter",["Saturn","Neptune","Earth"]),
("{v} is the most abundant gas in Earth's atmosphere.","The most abundant gas in Earth's atmosphere is {v}.","Nitrogen",["Oxygen","Carbon dioxide","Argon"]),
("The human heart has {v}.","The human heart is divided into {v}.","four chambers",["two chambers","three chambers","five chambers"]),
("{v} is the hardest naturally occurring material.","The hardest naturally occurring material is {v}.","Diamond",["Quartz","Graphite","Topaz"]),
("Plants absorb {v} for photosynthesis.","During photosynthesis, plants take in {v}.","carbon dioxide",["nitrogen","methane","helium"]),
("Water freezes at {v} at standard pressure.","At standard pressure, water freezes at {v}.","0 degrees Celsius",["minus 10 degrees Celsius","4 degrees Celsius","32 degrees Celsius"]),
("A leap year has {v}.","A leap year in the Gregorian calendar contains {v}.","366 days",["365 days","364 days","367 days"]),
("The Solar System has {v} planets.","The Solar System contains {v} recognised planets.","eight",["seven","nine","ten"]),
("The Great Barrier Reef lies off the coast of {v}.","The Great Barrier Reef is located off {v}.","Queensland, Australia",["Western Australia","Florida","the Philippines"]),
]
WRAP = ["{e}","Reference note: {e}","Textbook summary: {e}","{e} This is widely documented."]
def wrap(e): return random.choice(WRAP).format(e=e)
def cap(s): return s[0].upper()+s[1:]

# each generator returns (subject, claim_fn(v), evid_fn(v), right, wrong_pool, category)
items=[]
for c,cap_ in capitals.items():
    items.append(dict(cat="capitals",subj=c,
      claims=lambda v,c=c:random.choice([f"The capital of {c} is {v}.",f"{v} is the capital city of {c}.",f"{cap(c)}'s capital is {v}."]),
      evid=lambda v,c=c:random.choice([f"{v} is the capital city of {c}.",f"Reference works list {v} as the capital of {c}.",f"The capital of {c} is {v}.",f"{cap(c)} is a country whose capital city is {v}."]),
      right=cap_,pool=[x for x in capitals.values() if x!=cap_]))
for n,(sym,num) in elements.items():
    items.append(dict(cat="elements_number",subj=n,
      claims=lambda v,n=n:random.choice([f"The atomic number of {n} is {v}.",f"{n} has {v} protons in its nucleus.",f"{n} is element number {v}."]),
      evid=lambda v,n=n:random.choice([f"{n} is the chemical element with atomic number {v}.",f"An atom of {n} contains {v} protons.",f"In the periodic table, {n} occupies position {v}."]),
      right=str(num),pool=[str(x[1]) for k,x in elements.items() if x[1]!=num]))
    items.append(dict(cat="elements_symbol",subj=n+" symbol",
      claims=lambda v,n=n:random.choice([f"The chemical symbol for {n} is {v}.",f"{v} is the symbol of the element {n}."]),
      evid=lambda v,n=n:random.choice([f"The element {n} is represented by the symbol {v}.",f"{n} is abbreviated {v} in the periodic table.",f"The standard chemical symbol for {n} is {v}."]),
      right=sym,pool=[x[0] for x in elements.values() if x[0]!=sym]))
for clause,yr in events:
    def mk(clause=clause,yr=yr):
        return dict(cat="events",subj=clause,
          claims=lambda v:random.choice([f"In {v}, {clause}.",f"{cap(clause)} in {v}.",f"{cap(clause)} in the year {v}."]),
          evid=lambda v:random.choice([f"Historical records show that {clause} in {v}.",f"{cap(clause)} in {v}, according to standard histories.",f"The year {v} is when {clause}."]),
          right=str(yr),pool=[str(yr+d) for d in (-12,-9,-7,-5,-4,-3,-2,-1,1,2,3,4,5,7,9,12) if yr+d<=2025])
    items.append(mk())
for t,a in books.items():
    items.append(dict(cat="books",subj=t,
      claims=lambda v,t=t:random.choice([f"{t} was written by {v}.",f"{v} is the author of {t}.",f"The author of {t} is {v}."]),
      evid=lambda v,t=t:random.choice([f"{t} is a book by {v}.",f"The work {t} was authored by {v}.",f"{v} wrote {t}."]),
      right=a,pool=[x for x in set(books.values()) if x!=a]))
for i,p in enumerate(planets):
    items.append(dict(cat="planets",subj=p,
      claims=lambda v,p=p:random.choice([f"{p} is the {v} planet from the Sun.",f"Counting outward from the Sun, {p} is the {v} planet."]),
      evid=lambda v,p=p:random.choice([f"{p} is the {v} planet from the Sun in the Solar System.",f"In order of distance from the Sun, {p} comes {v}."]),
      right=ords[i],pool=[o for j,o in enumerate(ords) if j!=i]))
for c,ct in continents.items():
    items.append(dict(cat="geography",subj=c+" continent",
      claims=lambda v,c=c:random.choice([f"{c} is in {v}.",f"{c} is a country in {v}.",f"{c} lies on the continent of {v}."]),
      evid=lambda v,c=c:random.choice([f"{c} is located in {v}.",f"Geographically, {c} lies on the continent of {v}.",f"{c} is part of {v}."]),
      right=ct,pool=[x for x in set(continents.values()) if x!=ct]))
for n,f in formulas.items():
    items.append(dict(cat="formulas",subj=n,
      claims=lambda v,n=n:random.choice([f"The chemical formula of {n} is {v}.",f"{cap(n)} has the formula {v}.",f"{v} is the formula for {n}."]),
      evid=lambda v,n=n:random.choice([f"{cap(n)} has the chemical formula {v}.",f"The standard formula for {n} is {v}.",f"In chemistry, {n} is written as {v}."]),
      right=f,pool=[x for x in formulas.values() if x!=f]))
for cl,ev,right,wrongs in science:
    items.append(dict(cat="science",subj=cl[:30],
      claims=lambda v,cl=cl:cl.format(v=v), evid=lambda v,ev=ev:ev.format(v=v), right=right,pool=list(wrongs)))

WEIGHT={"capitals":22,"elements_number":10,"elements_symbol":10,"events":18,"books":12,"planets":3,"geography":9,"formulas":6,"science":10}
bycat={}
for it in items: bycat.setdefault(it["cat"],[]).append(it)
cats=list(WEIGHT); w=[WEIGHT[c] for c in cats]
def draw(): 
    c=random.choices(cats,w)[0]; return random.choice(bycat[c])

SUP_R=["The evidence states {r}, which matches the claim.","The retrieved source confirms {r}, so the claim is supported.","The evidence directly supports the claim: it gives {r}."]
UNS_R=["The evidence gives {r}, not {w}, so the claim is contradicted.","The source states {r}. The claim says {w}, which does not match.","Retrieved evidence contradicts the claim: the correct value is {r}."]
UNC_INS_R=["The evidence is about a different subject and does not address this claim.","The retrieved text does not mention what the claim asserts, so it cannot be confirmed.","The evidence is insufficient to confirm or contradict the claim."]
UNC_CON_R=["Sources disagree ({r} versus {w}), so the claim cannot be confirmed.","The evidence conflicts, giving both {r} and {w}.","Conflicting evidence means this claim cannot be marked supported or unsupported."]
CONF=["One source says: {a} Another source says: {b}","Sources disagree. Source A: {a} Source B: {b}","Conflicting reports. First report: {a} Second report: {b}"]

rows=[]; seen=set()
def add(label,it,claim,evidence,reason):
    key=(claim,evidence,label)
    if key in seen: return False
    seen.add(key)
    h=int(hashlib.md5(it["subj"].encode()).hexdigest(),16)%10
    split="train" if h<8 else ("val" if h==8 else "test")
    rows.append(dict(category=it["cat"],claim=claim,evidence=evidence,label=label,reasoning=reason,split=split)); return True

def gen(label,n):
    got=0
    while got<n:
        it=draw(); r=it["right"]
        if label=="supported":
            ok=add(label,it,it["claims"](r),wrap(it["evid"](r)),random.choice(SUP_R).format(r=r))
        elif label=="unsupported":
            wv=random.choice(it["pool"]); ok=add(label,it,it["claims"](wv),wrap(it["evid"](r)),random.choice(UNS_R).format(r=r,w=wv))
        else:
            if got%2==0:  # insufficient: evidence about a different item of same category
                other=random.choice([x for x in bycat[it["cat"]] if x["subj"]!=it["subj"]])
                v=random.choice([r]+it["pool"][:2])
                ok=add(label,it,it["claims"](v),wrap(other["evid"](other["right"])),random.choice(UNC_INS_R))
            else:  # conflicting sources
                wv=random.choice(it["pool"]); v=random.choice([r,wv])
                ev=random.choice(CONF).format(a=it["evid"](r),b=it["evid"](wv))
                ok=add(label,it,it["claims"](v),ev,random.choice(UNC_CON_R).format(r=r,w=wv))
        got+=1 if ok else 0
for lab in ("supported","uncertain","unsupported"): gen(lab,PER_LABEL)
random.shuffle(rows)
for i,r in enumerate(rows,1): r["id"]=f"tc-{i:05d}"
cols=["id","category","claim","evidence","label","reasoning","split"]
with open("trustcheck_verification_dataset.jsonl","w",encoding="utf-8") as f:
    for r in rows: f.write(json.dumps({k:r[k] for k in cols},ensure_ascii=False)+"\n")
with open("trustcheck_verification_dataset.csv","w",encoding="utf-8",newline="") as f:
    wr=csv.DictWriter(f,fieldnames=cols); wr.writeheader(); wr.writerows(rows)
print(len(rows))
