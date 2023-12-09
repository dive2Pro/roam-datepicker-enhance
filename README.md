# Datepick Enhancer

Datepick Enhancer allows Roam's date picker to convey additional information about each date:

1. the number of [blocks present](#number-of-blocks)
1. whether the date has been [mentioned](#mentions)
1. the number of [tasks due](#tasks-due-optional)

<br>
<img alt="An enhanced date picker" src="https://user-images.githubusercontent.com/23192045/208814065-23c13f81-0796-4ff4-be74-0ef1522b89e9.png" width="300">

## Number of blocks

Each date is shaded according to how many blocks are present in its corresponding Daily Note. The more blocks present, the deeper the shade of green.

## Mentions

An orange border is drawn around any date which has been mentioned at least once.

## Tasks due (optional)

A small number next to each date indicates the number of tasks due. A block is considered a due task when it both:

1. is a `{{[[TODO]]}}`
1. has a child block which both:
    1. begins with `due::` or has the tag `#due`
    1. mentions a `[[Date]]`, e.g. `[[January 1st, 2024]]`
  
Set another page to be used in place of `due` in Datepick Enhancer's settings, or set to `0` to disable this functionality.

### Example of a due task

![Structure of a minimal due task](https://user-images.githubusercontent.com/23192045/209608158-f3166598-685d-4dd7-9a58-16cabd067db5.png)
