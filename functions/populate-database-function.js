const functions = require("firebase-functions");
const admin = require('firebase-admin');

function Brewery(name, description, country, beers) {
    this.name = name;
    this.description = description;
    this.country = country;
    this.beers = beers;
}

Brewery.prototype.toJson = function () {
    return {
        name: this.name,
        description: this.description,
        country: this.country,
    };
}

function Beer(name, type, abv, imageExternalUrl) {
    this.name = name;
    this.type = type;
    this.abv = abv;
    this.imageExternalUrl = imageExternalUrl;
}

Beer.prototype.toJson = function () {
    return {
        name: this.name,
        type: this.type,
        abv: this.abv,
        imageExternalUrl: this.imageExternalUrl,
    };
}

const breweries = [
    new Brewery(
        'Espiga',
        'The passion to create a different, natural, and local beer. And the vocation of two biologists to give life to a beer with personality and a special character. A unique high-quality beer. Crafted in the heart of Penedès. A beer to enjoy, not only of the beer itself, but also of all the process: from the first idea, the first tests, the whole elaboration… To finally drinking it in company.',
        'Spain',
        [
            new Beer(
                'Hyperactive',
                'DDH IPA',
                7.5,
                'https://www.beergium.com/9512-big_default_2x/espiga-hyperactive-tdh-ipa-cans-44cl.jpg'
            ),
            new Beer(
                'Citrus Base',
                'DDH IPA',
                5.5,
                'https://www.espiga.cat/wp-content/uploads/2021/06/WEB-700x700_Citrus-Base-44cl.png'
            ),
            new Beer(
                'Dark Way',
                'DDH IPA',
                7.5,
                'https://www.espiga.cat/wp-content/uploads/2020/09/CERVESA-ESPIGA-DARK-WAY-CERVESA-ARTESANA-IMPERIAL-STOUT.png'
            ),
            new Beer(
                'Garage',
                'IPA',
                5.5,
                'https://static.unepetitemousse.fr/produits/bieres/espiga/garage-ipa.jpg'
            )
        ]
    ),
    new Brewery(
        'To Øl',
        'Starting out as a home brewing project back in 2005, To Øl was permanently established in 2010 working as a gypsy brewery lending in on other breweries spare capacity for the following decade. In 2019 we took over a former food factory in the Western part of Zealand, Denmark, where we’re setting up a full-blown specially designed brewery and craft beverage hub. To Øl City is the name of the place.',
        'Denmark',
        [
            new Beer(
                'City',
                'Session IPA',
                4.5,
                'https://www.dunells.com/media/xafpyetq/0018735_0.jpeg?mode=pad&width=800&height=800&saturation=0&bgcolor=ffffff'
            ),
            new Beer(
                'When life gives you Mango',
                'Milkshake IPA',
                4.5,
                'https://img.saveur-biere.com/img/p/36220-55345.jpg'
            )
        ]
    ),
    new Brewery(
        'Effet Papillon',
        '',
        'France',
        []
    ),
    new Brewery(
        'Piggy Brewing',
        '',
        'France',
        [
            new Beer(
                'Eroica',
                'DDH IPA',
                6.1,
                'https://media.cdnws.com/_i/214303/1558/1356/58/the-piggy-brewing-company-eroica-44cl.png'
            )
        ]), new Brewery(
            'La Superbe',
            '',
            'France',
            []
        ),
    new Brewery(
        'Le Détour !',
        '',
        'France',
        []
    )
];

exports.populateDatabase = async function populateDatabase() {
    functions.logger.info("Will now populate DB...");

    const firestore = admin.firestore();

    // Delete collections
    functions.logger.info('Deleting collections...');
    await deleteCollection(firestore, 'breweries', 20);

    // Populate database
    functions.logger.info('Populating database...');
    let promises = breweries.map((brewery) => {
        functions.logger.info('Adding brewery', brewery.name);
        return firestore
            .collection('breweries')
            .add(brewery.toJson())
            .then((ref) => {
                if (brewery.beers && brewery.beers.length > 0) {
                    return brewery.beers.map((beer) => {
                        functions.logger.info('Adding beer', beer.name);
                        firestore.collection('breweries')
                            .doc(ref.id)
                            .collection('beers')
                            .doc()
                            .set(beer.toJson());
                    });
                } else {
                    return Promise.resolve({});
                }
            });
    });

    await Promise.all(promises).then(_ => {
        response
            .status(201)
            .send("Database populated !");
    });
}

async function deleteCollection(db, collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}