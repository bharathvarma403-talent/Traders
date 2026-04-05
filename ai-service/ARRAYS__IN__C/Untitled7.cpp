#include<stdio.h>
int main(){

	int a[4]={11,22,33,44},i;
	int *p;
	p = a;
	for(i=0;i<4;i++)
	{
		printf("%d",*(p+i));
	}
}
