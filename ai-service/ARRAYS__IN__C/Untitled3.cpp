// 	______FLIP_THE_NAME_______
// _______bharath output should be BhArAtH
#include<stdio.h>
int main(){
	char name[] = {'b','h','a','r','a','t','h'};
	int i;
	for(i=0;i<7;i++)
	{
		if(i%2==0) name[i]=name[i]-32;
	}
	
	for(i=0
	;i<7;i++){
	 printf("%c ",name[i]);}

