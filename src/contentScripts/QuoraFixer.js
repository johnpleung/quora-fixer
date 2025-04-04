class QuoraFixer {

    /**
     * Gets an array of elements, with the given selector, containing the given phrases
     * 
     * @param {string} selector
     * @param {Array<string>} phrases
     * @return {Array<HtmlElement>}
     */
    static getElementsContainingPhrases (selector, phrases) {
        let elts = Array.from(document.querySelectorAll(selector || '*'));
        elts = elts.filter(elt => {
            for (let phrase of phrases) {
                if (!elt.textContent?.includes(phrase)) {
                    return false;
                }
            }
            return true;
        });
        return elts.length ? elts : null;
    }

    /**
     * Returns an array of each node going up the DOM tree, beginning with the node containing the given element
     * 
     * @param {HtmlElement} elt
     * @return {Array<HtmlElement>}
     */
    static getHierarchyTree (elt) {
        let ret = [];
        let currentNode = elt;
        while (true) {
            currentNode = currentNode.parentNode;
            if (currentNode) {
                ret.push(currentNode);
            } else {
                break;
            }
        }
        return ret;
    }

    /**
     * Filters out ancestors of the actual elements we want (the ones with most hierarchical depth)
     * 
     * @param {Array<HtmlElement>} elts
     * @return {Array<HtmlElement>}
     */
    static dedupeOccurrences (elts) {
        let ret = [];
        for (let elt1 of elts) {
            let isUnique = true;
            for (let elt2 of elts) {
                if (elt1 !== elt2) {
                    let hierarchy = QuoraFixer.getHierarchyTree(elt2);
                    if (hierarchy.includes(elt1)) {
                        isUnique = false;
                        break;
                    }
                }
            }
            if (isUnique) {
                ret.push(elt1);
            }
        }
        return ret;
    }

    /**
     * Hides "Sponsored by" and some "Related question" boxes
     * 
     * @param {Array<HtmlElement>} matchingElements
     * @return {void}
     */
    static hideSponsoredByAndRelatedQuestionsBoxes (matchingElements) {
        if (matchingElements && matchingElements.length) {
            matchingElements.forEach(elt => {
                let classes = elt && elt.classList && elt.classList.toString && elt.classList.toString();
                if (!classes.includes('dom_annotate_question_answer_item_')) {
                    elt.classList.add('quora-garbage');
                }
            });
        }
    }

    /**
     * Gets the post container for the given post element
     * 
     * @param {HtmlElement} elt
     * @return {HtmlElement}
     */
    static getPostContainer (elt) {
        let ancestors = QuoraFixer.getHierarchyTree(elt);
        if (ancestors?.length) {
            return ancestors.find(ancestor => !!(ancestor.classList && ancestor.classList.toString && ancestor.classList.toString().includes('dom_annotate_question_answer_item_'))) || null;
        }
    }

    /**
     * Hides unrelated questions boxes
     * 
     * @param {Array<HtmlElement>} matchingElements
     * @return {void}
     */
    static hideUnrelatedQuestions (matchingElements) {
        if (matchingElements && matchingElements.length) {
            matchingElements = QuoraFixer.dedupeOccurrences(matchingElements);
            if (matchingElements && matchingElements.length) {
                for (let matchingElement of matchingElements) {
                    let postContainer = QuoraFixer.getPostContainer(matchingElement);
                    if (postContainer) {
                        postContainer.classList.add('quora-garbage');
                    }
                }
            }
        }
    }

    /**
     * Hides remaining "Related question" boxes
     * 
     * @param {Array<HtmlElement>} matchingElements
     * @return {void}
     */
    static hideRemainingRelatedQuestions (matchingElements) {
        if (matchingElements && matchingElements.length) {
            matchingElements = QuoraFixer.dedupeOccurrences(matchingElements);
            if (matchingElements && matchingElements.length) {
                for (let matchingElement of matchingElements) {
                    let ancestors = QuoraFixer.getHierarchyTree(matchingElement);
                    for (let i = 0; i < ancestors.length - 2; i++) {
                        let ancestor = ancestors[i];
                        let nextNextAncestor = ancestors[i + 2];
                        if (nextNextAncestor && nextNextAncestor.getAttribute && nextNextAncestor.getAttribute('id') === 'mainContent') {
                            ancestor.classList.add('quora-garbage');
                        }
                    }
                }
            }
        }
    }

    /**
     * Hides "Advertisement" posts
     * 
     * @param {Array<HtmlElement>} matchingElements
     * @return {void}
     */
    static hideAdPosts (matchingElements) {
        if (matchingElements && matchingElements.length) {
            matchingElements = QuoraFixer.dedupeOccurrences(matchingElements);
            if (matchingElements && matchingElements.length) {
                for (let matchingElement of matchingElements) {
                    let ancestors = QuoraFixer.getHierarchyTree(matchingElement);
                    let postContainer = ancestors.find(ancestor => ancestor.matches('.dom_annotate_multifeed_home > div > div'));
                    if (postContainer) {
                        postContainer.classList.add('quora-garbage');
                    }
                }
            }
        }
    }

    /**
     * Hides "Originally Answered" posts
     * 
     * @param {Array<HtmlElement>} matchingElements
     * @return {void}
     */
    static hideOriginallyAnsweredBoxes (matchingElements) {
        if (matchingElements && matchingElements.length) {
            matchingElements = QuoraFixer.dedupeOccurrences(matchingElements);
            if (matchingElements && matchingElements.length) {
                for (let matchingElement of matchingElements) {
                    let postContainer = QuoraFixer.getPostContainer(matchingElement);
                    if (postContainer) {
                        postContainer.classList.add('quora-garbage');
                    }
                }
            }
        }
    }

    /**
     * Hides the garbage
     * 
     * @return {void}
     */
    static hideTheGarbage () {
        try {
            let mainContentElt = document.querySelector('#mainContent');
            if (mainContentElt) {
                // Article pages
                let isArticlePage = document.title?.endsWith(' - Quora');
                if (isArticlePage) {
                    // Make main content column wider since we're hiding the side bar with the ads
                    mainContentElt.style.width = 'auto';
                    // Gets rid of garbage such as "Sponsored by" and (certain) "Related questions" boxes
                    QuoraFixer.hideSponsoredByAndRelatedQuestionsBoxes(Array.from(document.querySelectorAll('#mainContent > div:not(.q-box) > .q-box')));
                    // Gets rid of unrelated questions
                    QuoraFixer.hideUnrelatedQuestions(QuoraFixer.getElementsContainingPhrases('.q-text', [ 'Related' ]));
                    // Gets rid of remaining "Related questions" boxes
                    QuoraFixer.hideRemainingRelatedQuestions(QuoraFixer.getElementsContainingPhrases('.q-text', [ 'Related questions' ]));
                    // Gets rid of "Originally Answered" boxes
                    QuoraFixer.hideOriginallyAnsweredBoxes(QuoraFixer.getElementsContainingPhrases('.q-text', [ 'Originally Answered' ]));
                }
                // Main feed for logged-in users
                let isMainFeed = window.location.pathname === '/';
                if (isMainFeed) {
                    // Gets rid of "Advertisement" posts in feed
                    QuoraFixer.hideAdPosts(QuoraFixer.getElementsContainingPhrases('.dom_annotate_multifeed_home .q-text', [ 'Advertisement' ]));
                }
            }
        } catch (ex) {
            console.log(`hideTheGarbage(): ${ex.message}`);
        }
    }

    /**
     * Watches for newly rendered DOM elements and hides any garbage found
     * 
     * @return {void}
     */
    static watchForNewGarbage () {
        try {
            let mainContentElt = document.querySelector('#mainContent');
            if (mainContentElt) {
                let tmr;
                let observer = new MutationObserver(mutations => {
                    if (mutations.find(mutation => !!(mutation.addedNodes && mutation.addedNodes.length))) {
                        window.clearTimeout(tmr);
                        tmr = window.setTimeout(QuoraFixer.hideTheGarbage, 100);
                    }
                });
                observer.observe(mainContentElt, { attributes: true, childList: true, subtree: true, characterData: true });    
            }
        } catch (ex) {
            console.log(`watchForNewGarbage(): ${ex.message}`);
        }
    }
}

QuoraFixer.watchForNewGarbage();